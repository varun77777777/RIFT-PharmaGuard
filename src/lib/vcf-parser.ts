/**
 * PharmaGuard — VCF v4.2 Parser
 * Extracts RSIDs, Genotypes, and maps to Star Alleles for pharmacogenomics analysis.
 *
 * Architecture:
 *   1. Parse raw VCF text → VCFRecord[]
 *   2. Resolve GT field using REF/ALT alleles
 *   3. Look up RSID against the pharmacogenomic RSID mapping table
 *   4. Return detected variants for each target gene
 */

import type { VCFRecord, DetectedVariant, GeneName, VCFParseResult } from "./types";
import { RSID_MAPPING, TARGET_GENES } from "./pharmacogenomics";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB


/**
 * Resolves the raw GT field (e.g. "0|1", "1/1") to allele-based genotype string.
 * Example: ref="C", alt="T", gt="0|1" → "C/T"
 */
function resolveGenotype(ref: string, alt: string, gt: string): string {
  const alleles = [ref, ...alt.split(",")]; // index 0 = ref, 1+ = alt alleles
  const normalized = gt.replace(/\|/g, "/");
  const indices = normalized.split("/");

  const resolved = indices.map((idx) => {
    const i = parseInt(idx, 10);
    if (isNaN(i)) return ".";
    return alleles[i] ?? ".";
  });

  return resolved.join("/");
}

/**
 * Extract the GT (genotype) field value from a FORMAT + SAMPLE column pair.
 * VCF FORMAT example: "GT:AD:DP" → SAMPLE "0|1:12,8:20" → GT = "0|1"
 */
function extractGT(format: string, sample: string): string {
  const formatFields = format.split(":");
  const sampleFields = sample.split(":");
  const gtIndex = formatFields.indexOf("GT");
  if (gtIndex === -1) return "./.";
  return sampleFields[gtIndex] ?? "./.";
}

/**
 * Core VCF parser — handles VCF v4.1 and v4.2 format.
 */
export function parseVCF(rawText: string): VCFParseResult {
  const errors: string[] = [];
  const records: VCFRecord[] = [];
  let vcfVersion = "unknown";
  let sampleId = "SAMPLE_001";

  const lines = rawText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Metadata lines
    if (trimmed.startsWith("##")) {
      if (trimmed.startsWith("##fileformat=VCF")) {
        vcfVersion = trimmed.replace("##fileformat=", "");
      }
      continue;
    }

    // Header line — extract sample name
    if (trimmed.startsWith("#CHROM")) {
      const cols = trimmed.split("\t");
      if (cols.length > 9) {
        sampleId = cols[9].trim() || "SAMPLE_001";
      }
      continue;
    }

    // Data lines
    const cols = trimmed.split("\t");
    if (cols.length < 8) {
      errors.push(`Skipped malformed line (${cols.length} columns): ${trimmed.substring(0, 60)}`);
      continue;
    }

    const [chrom, pos, id, ref, alt, qual, filter, info, format = "GT", sample = "0/0"] = cols;

    const position = parseInt(pos, 10);
    if (isNaN(position)) {
      errors.push(`Invalid position: ${pos}`);
      continue;
    }

    const rawGT = extractGT(format, sample);
    const resolvedGenotype = resolveGenotype(ref, alt, rawGT);

    records.push({
      chromosome: chrom,
      position,
      id: id === "." ? "" : id,
      ref,
      alt,
      qual,
      filter,
      info,
      format,
      genotype: rawGT,
      resolvedGenotype,
    });
  }

  // Map detected variants to target genes
  const variantsByGene = mapVariantsToGenes(records, errors);

  return {
    records,
    variantsByGene,
    totalVariants: records.length,
    vcfVersion,
    sampleId,
    errors,
  };
}

/**
 * Cross-reference VCF records against the pharmacogenomic RSID mapping table.
 * For each target gene, collect all detected variants with their star allele annotations.
 */
function mapVariantsToGenes(
  records: VCFRecord[],
  errors: string[]
): Map<GeneName, DetectedVariant[]> {
  const variantsByGene = new Map<GeneName, DetectedVariant[]>();

  // Initialize empty arrays for all target genes
  for (const gene of TARGET_GENES) {
    variantsByGene.set(gene, []);
  }

  for (const record of records) {
    // Skip records with no RSID
    if (!record.id) continue;

    const rsidLower = record.id.toLowerCase();
    const mapping = RSID_MAPPING.find((m) => m.rsid.toLowerCase() === rsidLower);

    if (!mapping) continue;

    const geneVariants = variantsByGene.get(mapping.gene) ?? [];

    // Determine star allele based on whether alt allele is present
    const hasAlt = !record.genotype.startsWith("0/0") && !record.genotype.startsWith("0|0");
    const isHomAlt = record.genotype === "1/1" || record.genotype === "1|1";

    let starAllele: string;
    if (!hasAlt) {
      starAllele = mapping.star_allele_ref; // homozygous reference
    } else if (isHomAlt) {
      starAllele = `${mapping.star_allele_alt}/${mapping.star_allele_alt}`;
    } else {
      starAllele = `${mapping.star_allele_ref}/${mapping.star_allele_alt}`;
    }

    geneVariants.push({
      rsid: record.id,
      genotype: record.resolvedGenotype,
      starAllele,
      chromosome: record.chromosome,
      position: record.position,
      ref: record.ref,
      alt: record.alt,
    });

    variantsByGene.set(mapping.gene, geneVariants);
  }

  return variantsByGene;
}

/**
 * Validate a file before parsing:
 *  - Must be ≤ 5MB
 *  - Must have .vcf extension or VCF-like content
 */
export function validateVCFFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large. Maximum allowed size is 5 MB (uploaded: ${(file.size / 1024 / 1024).toFixed(2)} MB).`,
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "vcf") {
    return {
      valid: false,
      error: `Invalid file type ".${ext}". Please upload a .vcf file.`,
    };
  }

  return { valid: true };
}

/**
 * Read a File object and return its text content.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/**
 * Generate a synthetic demo VCF for testing the pipeline.
 * Includes variants for all 6 target genes with clinically significant RSIDs.
 */
export function generateDemoVCF(scenario: "normal" | "high-risk" | "mixed" = "mixed"): string {
  const baseHeader = `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##contig=<ID=chr1,length=248956422>
##contig=<ID=chr7,length=159345973>
##contig=<ID=chr10,length=133797422>
##contig=<ID=chr22,length=50818468>
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tPATIENT_DEMO
`;

  // Scenario: normal — all wildtype
  if (scenario === "normal") {
    return baseHeader + `chr22\t42522613\trs3892097\tC\tT\t.\tPASS\t.\tGT\t0/0
chr10\t96521657\trs4244285\tG\tA\t.\tPASS\t.\tGT\t0/0
chr10\t96702047\trs1799853\tC\tT\t.\tPASS\t.\tGT\t0/0
chr12\t21331549\trs4149056\tT\tC\t.\tPASS\t.\tGT\t0/0
chr6\t18128382\trs1800462\tC\tA\t.\tPASS\t.\tGT\t0/0
chr1\t97981395\trs3918290\tC\tT\t.\tPASS\t.\tGT\t0/0
`;
  }

  // Scenario: high-risk — all homozygous alt (poor metabolizers)
  if (scenario === "high-risk") {
    return baseHeader + `chr22\t42522613\trs3892097\tC\tT\t.\tPASS\t.\tGT\t1/1
chr10\t96521657\trs4244285\tG\tA\t.\tPASS\t.\tGT\t1/1
chr10\t96702047\trs1799853\tC\tT\t.\tPASS\t.\tGT\t1/1
chr12\t21331549\trs4149056\tT\tC\t.\tPASS\t.\tGT\t1/1
chr6\t18128382\trs1800462\tC\tA\t.\tPASS\t.\tGT\t1/1
chr1\t97981395\trs3918290\tC\tT\t.\tPASS\t.\tGT\t1/1
`;
  }

  // Scenario: mixed — realistic clinical scenario
  return baseHeader + `chr22\t42522613\trs3892097\tC\tT\t.\tPASS\t.\tGT\t0/1
chr22\t42522613\trs35742686\tC\tdel\t.\tPASS\t.\tGT\t0/0
chr10\t96521657\trs4244285\tG\tA\t.\tPASS\t.\tGT\t0/1
chr10\t96702047\trs1799853\tC\tT\t.\tPASS\t.\tGT\t1/1
chr10\t96741053\trs1057910\tA\tC\t.\tPASS\t.\tGT\t0/0
chr12\t21331549\trs4149056\tT\tC\t.\tPASS\t.\tGT\t0/1
chr6\t18128382\trs1800462\tC\tA\t.\tPASS\t.\tGT\t0/0
chr6\t18130918\trs1800460\tC\tA\t.\tPASS\t.\tGT\t0/1
chr1\t97981395\trs3918290\tC\tT\t.\tPASS\t.\tGT\t0/0
chr1\t98348885\trs67376798\tA\tT\t.\tPASS\t.\tGT\t0/1
`;
}
