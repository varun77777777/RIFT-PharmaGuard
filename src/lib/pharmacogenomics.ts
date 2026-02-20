/**
 * PharmaGuard — Pharmacogenomics Knowledge Base
 *
 * Implements the CPIC (Clinical Pharmacogenetics Implementation Consortium) guideline
 * lookup tables for 6 drug-gene pairs. Maps genotypes → phenotypes → risk assessments.
 *
 * Genes covered: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
 * Drugs covered: CODEINE, WARFARIN, CLOPIDOGREL, SIMVASTATIN, AZATHIOPRINE, FLUOROURACIL
 */

import type {
  RSIDMapping,
  CPICRule,
  PharmacogenomicReport,
  DrugName,
  GeneName,
  Phenotype,
  DetectedVariant,
  VCFParseResult,
} from "./types";

// ─── Target Genes ────────────────────────────────────────────────────────────
export const TARGET_GENES: GeneName[] = [
  "CYP2D6",
  "CYP2C19",
  "CYP2C9",
  "SLCO1B1",
  "TPMT",
  "DPYD",
];

export const GENE_TO_DRUG: Record<GeneName, DrugName> = {
  CYP2D6: "CODEINE",
  CYP2C19: "CLOPIDOGREL",
  CYP2C9: "WARFARIN",
  SLCO1B1: "SIMVASTATIN",
  TPMT: "AZATHIOPRINE",
  DPYD: "FLUOROURACIL",
};

// ─── RSID → Star Allele Mapping ──────────────────────────────────────────────
// Source: PharmVar, CPIC, ClinVar
export const RSID_MAPPING: RSIDMapping[] = [
  // CYP2D6
  { rsid: "rs3892097",  gene: "CYP2D6",  ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "*4",  function_impact: "no_function" },
  { rsid: "rs35742686", gene: "CYP2D6",  ref: "C", alt: "del", star_allele_ref: "*1", star_allele_alt: "*3", function_impact: "no_function" },
  { rsid: "rs5030655",  gene: "CYP2D6",  ref: "A", alt: "del", star_allele_ref: "*1", star_allele_alt: "*6", function_impact: "no_function" },
  { rsid: "rs16947",    gene: "CYP2D6",  ref: "G", alt: "A",   star_allele_ref: "*1", star_allele_alt: "*2", function_impact: "normal" },
  { rsid: "rs1135840",  gene: "CYP2D6",  ref: "G", alt: "C",   star_allele_ref: "*1", star_allele_alt: "*10", function_impact: "reduced" },

  // CYP2C19
  { rsid: "rs4244285",  gene: "CYP2C19", ref: "G", alt: "A", star_allele_ref: "*1",  star_allele_alt: "*2",  function_impact: "no_function" },
  { rsid: "rs4986893",  gene: "CYP2C19", ref: "G", alt: "A", star_allele_ref: "*1",  star_allele_alt: "*3",  function_impact: "no_function" },
  { rsid: "rs12248560", gene: "CYP2C19", ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "*17", function_impact: "increased" },

  // CYP2C9
  { rsid: "rs1799853",  gene: "CYP2C9",  ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "*2",  function_impact: "reduced" },
  { rsid: "rs1057910",  gene: "CYP2C9",  ref: "A", alt: "C", star_allele_ref: "*1",  star_allele_alt: "*3",  function_impact: "no_function" },
  { rsid: "rs28371686", gene: "CYP2C9",  ref: "G", alt: "A", star_allele_ref: "*1",  star_allele_alt: "*5",  function_impact: "reduced" },

  // SLCO1B1
  { rsid: "rs4149056",  gene: "SLCO1B1", ref: "T", alt: "C", star_allele_ref: "*1a", star_allele_alt: "*5",  function_impact: "reduced" },
  { rsid: "rs2306283",  gene: "SLCO1B1", ref: "A", alt: "G", star_allele_ref: "*1a", star_allele_alt: "*1b", function_impact: "normal" },

  // TPMT
  { rsid: "rs1800462",  gene: "TPMT",    ref: "C", alt: "A", star_allele_ref: "*1",  star_allele_alt: "*2",  function_impact: "no_function" },
  { rsid: "rs1800460",  gene: "TPMT",    ref: "C", alt: "A", star_allele_ref: "*1",  star_allele_alt: "*3B", function_impact: "no_function" },
  { rsid: "rs1142345",  gene: "TPMT",    ref: "T", alt: "C", star_allele_ref: "*1",  star_allele_alt: "*3C", function_impact: "no_function" },

  // DPYD
  { rsid: "rs3918290",  gene: "DPYD",    ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "*2A", function_impact: "no_function" },
  { rsid: "rs55886062", gene: "DPYD",    ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "*13", function_impact: "no_function" },
  { rsid: "rs67376798", gene: "DPYD",    ref: "A", alt: "T", star_allele_ref: "*1",  star_allele_alt: "HapB3", function_impact: "reduced" },
  { rsid: "rs75017182", gene: "DPYD",    ref: "C", alt: "T", star_allele_ref: "*1",  star_allele_alt: "c.1236G>A", function_impact: "reduced" },
];

// ─── CPIC Rule Knowledge Base ────────────────────────────────────────────────
export const CPIC_RULES: CPICRule[] = [
  // ── CODEINE / CYP2D6 ──────────────────────────────────────────────────────
  {
    gene: "CYP2D6", drug: "CODEINE", phenotype: "PM",
    diplotype_examples: ["*3/*4", "*4/*4", "*3/*3", "*4/*6", "*4/*5"],
    risk_label: "Toxic", severity: "critical", confidence_score: 0.97,
    action: "Avoid codeine. Use an alternative opioid not metabolized by CYP2D6.",
    dosage_adjustment: "Contraindicated. Consider morphine or oxycodone with appropriate dose adjustments.",
    summary: "This patient is a CYP2D6 Poor Metabolizer. Codeine cannot be adequately converted to morphine, leading to accumulation of codeine and severe CNS/respiratory toxicity risk.",
    mechanism: "Codeine is a prodrug requiring CYP2D6-mediated O-demethylation to morphine for analgesic effect. In Poor Metabolizers, this conversion is absent, causing codeine accumulation. Paradoxically, ineffective analgesia combined with higher codeine plasma concentrations creates toxicity risk including respiratory depression.",
  },
  {
    gene: "CYP2D6", drug: "CODEINE", phenotype: "IM",
    diplotype_examples: ["*1/*4", "*1/*5", "*2/*4", "*10/*4"],
    risk_label: "Adjust Dosage", severity: "moderate", confidence_score: 0.88,
    action: "Use codeine with caution at reduced dose or consider an alternative.",
    dosage_adjustment: "Reduce starting dose by 25–50%. Monitor closely for inadequate analgesia and adverse effects.",
    summary: "This patient is a CYP2D6 Intermediate Metabolizer. Reduced CYP2D6 activity results in lower-than-expected morphine conversion, potentially diminishing analgesic efficacy.",
    mechanism: "With one functional and one non-functional (or reduced-function) CYP2D6 allele, enzymatic capacity for codeine O-demethylation is reduced ~50%. This leads to subtherapeutic morphine concentrations and variable analgesic response.",
  },
  {
    gene: "CYP2D6", drug: "CODEINE", phenotype: "NM",
    diplotype_examples: ["*1/*1", "*1/*2", "*2/*2"],
    risk_label: "Safe", severity: "none", confidence_score: 0.95,
    action: "Standard codeine therapy. Use label-recommended dosing.",
    dosage_adjustment: "No dosage adjustment required.",
    summary: "Normal CYP2D6 activity detected. Codeine is expected to be metabolized to morphine at the standard rate, providing adequate analgesia with normal risk profile.",
    mechanism: "Normal CYP2D6 enzyme activity produces expected morphine concentrations from codeine prodrug conversion, resulting in standard analgesic efficacy and safety profile as defined in the drug label.",
  },
  {
    gene: "CYP2D6", drug: "CODEINE", phenotype: "URM",
    diplotype_examples: ["*1/*1xN", "*2/*2xN", "*1/*2xN"],
    risk_label: "Toxic", severity: "high", confidence_score: 0.94,
    action: "Avoid codeine. Ultra-rapid conversion to morphine risks life-threatening toxicity.",
    dosage_adjustment: "Contraindicated. Use non-CYP2D6 metabolized opioids such as fentanyl or buprenorphine.",
    summary: "This patient is a CYP2D6 Ultra-Rapid Metabolizer. Excessive conversion of codeine to morphine results in dangerously high morphine plasma levels, risking respiratory depression and death.",
    mechanism: "CYP2D6 gene duplication amplifies enzymatic capacity for O-demethylation, converting codeine to morphine far exceeding normal rates. Even standard doses can produce morphine concentrations equivalent to a morphine overdose, particularly dangerous in pediatric patients and nursing mothers (FDA Black Box Warning).",
  },

  // ── CLOPIDOGREL / CYP2C19 ─────────────────────────────────────────────────
  {
    gene: "CYP2C19", drug: "CLOPIDOGREL", phenotype: "PM",
    diplotype_examples: ["*2/*2", "*2/*3", "*3/*3"],
    risk_label: "Ineffective", severity: "high", confidence_score: 0.96,
    action: "Avoid clopidogrel. Use an alternative antiplatelet agent.",
    dosage_adjustment: "Contraindicated for high-risk ACS/PCI patients. Switch to prasugrel or ticagrelor per cardiologist guidance.",
    summary: "CYP2C19 Poor Metabolizer. Clopidogrel cannot be bioactivated to its active thiol metabolite, resulting in inadequate platelet inhibition and significantly elevated MACE risk.",
    mechanism: "Clopidogrel is a prodrug requiring two-step CYP2C19-mediated hepatic oxidation to generate the active thiol metabolite that irreversibly inhibits P2Y12 receptors. In Poor Metabolizers, this activation step is absent, leaving platelets uninhibited and increasing risk of stent thrombosis and major cardiovascular events.",
  },
  {
    gene: "CYP2C19", drug: "CLOPIDOGREL", phenotype: "IM",
    diplotype_examples: ["*1/*2", "*1/*3", "*2/*17"],
    risk_label: "Adjust Dosage", severity: "moderate", confidence_score: 0.85,
    action: "Consider alternative antiplatelet therapy, especially in high-risk cardiovascular patients.",
    dosage_adjustment: "Standard dose may be used in low-risk patients. High-risk patients (ACS, PCI) should receive prasugrel or ticagrelor.",
    summary: "Intermediate CYP2C19 function reduces clopidogrel bioactivation. Antiplatelet response may be suboptimal, particularly in high-risk cardiac scenarios.",
    mechanism: "One reduced-function allele diminishes hepatic two-step bioactivation of clopidogrel to its active metabolite. Residual enzyme activity provides partial platelet inhibition, but response is less predictable compared to normal metabolizers.",
  },
  {
    gene: "CYP2C19", drug: "CLOPIDOGREL", phenotype: "NM",
    diplotype_examples: ["*1/*1"],
    risk_label: "Safe", severity: "none", confidence_score: 0.95,
    action: "Standard clopidogrel therapy. Proceed with label-recommended dosing.",
    dosage_adjustment: "No dosage adjustment required.",
    summary: "Normal CYP2C19 function. Clopidogrel will be bioactivated at the expected rate, providing standard platelet inhibition.",
    mechanism: "Normal CYP2C19 enzymatic activity ensures efficient two-step hepatic bioactivation of clopidogrel to its active thiol metabolite, resulting in adequate P2Y12 receptor inhibition.",
  },
  {
    gene: "CYP2C19", drug: "CLOPIDOGREL", phenotype: "RM",
    diplotype_examples: ["*1/*17", "*17/*17"],
    risk_label: "Safe", severity: "low", confidence_score: 0.82,
    action: "Standard therapy. Monitor for enhanced antiplatelet effect.",
    dosage_adjustment: "No adjustment required but monitor for bleeding. Rapid metabolizers may have increased active metabolite exposure.",
    summary: "Rapid CYP2C19 metabolizer. Enhanced clopidogrel bioactivation may increase active metabolite levels; generally beneficial but monitor for excess bleeding.",
    mechanism: "CYP2C19*17 variant increases transcription of CYP2C19 enzyme, accelerating the two-step bioactivation of clopidogrel. This typically improves antiplatelet efficacy but may increase bleeding risk at standard doses.",
  },

  // ── WARFARIN / CYP2C9 ─────────────────────────────────────────────────────
  {
    gene: "CYP2C9", drug: "WARFARIN", phenotype: "PM",
    diplotype_examples: ["*2/*3", "*3/*3", "*3/*5"],
    risk_label: "Adjust Dosage", severity: "high", confidence_score: 0.95,
    action: "Start with significantly reduced warfarin dose. Intensive INR monitoring required.",
    dosage_adjustment: "Reduce initial dose by 50–75%. Target INR 2.0–3.0. INR checks every 3–5 days until stable. Consider genotype-guided dosing algorithms (IWPC, Gage).",
    summary: "CYP2C9 Poor Metabolizer. Severely reduced warfarin (S-warfarin) clearance dramatically increases bleeding risk. Requires substantially reduced dosing and intensive monitoring.",
    mechanism: "S-warfarin (the more potent enantiomer) is primarily metabolized by CYP2C9. Loss-of-function variants (*2/*3, *3/*3) severely impair S-warfarin clearance, causing accumulation of the active anticoagulant. This leads to supratherapeutic INR and elevated major bleeding risk. CPIC recommends genotype-guided initial dosing.",
  },
  {
    gene: "CYP2C9", drug: "WARFARIN", phenotype: "IM",
    diplotype_examples: ["*1/*2", "*1/*3", "*2/*2"],
    risk_label: "Adjust Dosage", severity: "moderate", confidence_score: 0.91,
    action: "Reduce initial warfarin dose. More frequent INR monitoring during initiation.",
    dosage_adjustment: "Reduce initial dose by 20–30%. Genotype-guided dose algorithms recommended (IWPC equation). Monitor INR closely for first 4 weeks.",
    summary: "CYP2C9 Intermediate Metabolizer. Reduced S-warfarin clearance requires dosage reduction to prevent over-anticoagulation during initiation.",
    mechanism: "One reduced-function CYP2C9 allele partially impairs S-warfarin hydroxylation, reducing clearance compared to normal metabolizers. Patients typically require lower maintenance doses (10–30% less) and are at increased bleeding risk during warfarin initiation.",
  },
  {
    gene: "CYP2C9", drug: "WARFARIN", phenotype: "NM",
    diplotype_examples: ["*1/*1"],
    risk_label: "Safe", severity: "none", confidence_score: 0.93,
    action: "Standard warfarin initiation. Use label-recommended starting dose.",
    dosage_adjustment: "No genotype-based adjustment required. Follow standard INR monitoring protocol.",
    summary: "Normal CYP2C9 function. Standard warfarin dosing is appropriate. Maintain standard INR monitoring per clinical guidelines.",
    mechanism: "Normal CYP2C9 activity provides expected S-warfarin clearance. Standard dosing algorithms apply without genotype-based modification.",
  },

  // ── SIMVASTATIN / SLCO1B1 ─────────────────────────────────────────────────
  {
    gene: "SLCO1B1", drug: "SIMVASTATIN", phenotype: "PM",
    diplotype_examples: ["*5/*5", "*5/*15", "*15/*15"],
    risk_label: "Toxic", severity: "high", confidence_score: 0.93,
    action: "Avoid simvastatin 40–80mg. High myopathy risk. Switch to alternative statin.",
    dosage_adjustment: "If statin therapy required, use rosuvastatin ≤20mg or pravastatin ≤40mg (lower SLCO1B1 transport dependency). Avoid all high-dose simvastatin.",
    summary: "SLCO1B1 Poor Function detected. Severely impaired hepatic simvastatin uptake causes 4–5× higher plasma simvastatin acid exposure, dramatically elevating myopathy and rhabdomyolysis risk.",
    mechanism: "SLCO1B1 (*5 variant, rs4149056) encodes OATP1B1, the primary hepatic uptake transporter for simvastatin acid. Loss-of-function variants severely reduce hepatic clearance of active simvastatin acid, causing systemic accumulation in muscle tissue. This activates mitochondrial membrane disruption and ATP depletion, manifesting as myopathy and potentially life-threatening rhabdomyolysis.",
  },
  {
    gene: "SLCO1B1", drug: "SIMVASTATIN", phenotype: "IM",
    diplotype_examples: ["*1a/*5", "*1a/*15", "*1b/*5"],
    risk_label: "Adjust Dosage", severity: "moderate", confidence_score: 0.88,
    action: "Use lower simvastatin dose (≤20mg) or alternative statin. Counsel on myopathy symptoms.",
    dosage_adjustment: "Limit simvastatin to 20mg/day maximum. Monitor CK levels. Consider rosuvastatin or pravastatin as alternatives with better SLCO1B1 tolerance.",
    summary: "Intermediate SLCO1B1 function. Moderately elevated simvastatin acid systemic exposure increases myopathy risk above baseline. Dose limitation and monitoring recommended.",
    mechanism: "Heterozygous SLCO1B1 *5 or *15 reduces OATP1B1 transport capacity by approximately 50%, causing intermediate elevation of systemic simvastatin acid concentrations. Myopathy risk is 2–3× baseline but manageable with dose restriction.",
  },
  {
    gene: "SLCO1B1", drug: "SIMVASTATIN", phenotype: "NM",
    diplotype_examples: ["*1a/*1a", "*1a/*1b", "*1b/*1b"],
    risk_label: "Safe", severity: "none", confidence_score: 0.92,
    action: "Standard simvastatin therapy. Follow label-recommended dosing.",
    dosage_adjustment: "No adjustment required. Standard dosing appropriate.",
    summary: "Normal SLCO1B1 transporter function. Simvastatin acid is efficiently cleared by OATP1B1, maintaining normal plasma concentrations with standard myopathy risk.",
    mechanism: "Normal OATP1B1 activity ensures adequate hepatic first-pass extraction of simvastatin acid, preventing systemic accumulation. Myopathy risk remains at population baseline.",
  },

  // ── AZATHIOPRINE / TPMT ───────────────────────────────────────────────────
  {
    gene: "TPMT", drug: "AZATHIOPRINE", phenotype: "PM",
    diplotype_examples: ["*2/*3A", "*3A/*3A", "*3B/*3C", "*2/*3C"],
    risk_label: "Toxic", severity: "critical", confidence_score: 0.98,
    action: "Avoid azathioprine/6-MP. Life-threatening myelosuppression risk.",
    dosage_adjustment: "Contraindicated at standard doses. If use is unavoidable, reduce dose by >90% (e.g., 10% of standard) with extremely close CBC monitoring. Consult hematology.",
    summary: "TPMT Poor Metabolizer. Absent TPMT activity causes massive accumulation of cytotoxic 6-thioguanine nucleotides (6-TGNs), resulting in severe, potentially fatal myelosuppression.",
    mechanism: "TPMT catalyzes S-methylation of thiopurine drugs, inactivating them. With absent enzyme activity, azathioprine/6-MP is shunted entirely toward 6-TGN production via HGPRT. Accumulation of 6-TGNs in hematopoietic cells causes profound bone marrow suppression, leading to leukopenia, anemia, and thrombocytopenia. CPIC assigns highest recommendation strength for dose avoidance.",
  },
  {
    gene: "TPMT", drug: "AZATHIOPRINE", phenotype: "IM",
    diplotype_examples: ["*1/*2", "*1/*3A", "*1/*3B", "*1/*3C"],
    risk_label: "Adjust Dosage", severity: "moderate", confidence_score: 0.92,
    action: "Reduce azathioprine dose by 30–70%. Monitor CBC frequently.",
    dosage_adjustment: "Start at 50% of standard dose. Titrate based on CBC response and 6-TGN levels. Weekly CBC for first 2 months, then monthly.",
    summary: "TPMT Intermediate Metabolizer. Reduced TPMT activity leads to higher 6-TGN accumulation. Dose reduction and enhanced monitoring required to prevent myelosuppression.",
    mechanism: "Heterozygous TPMT variants reduce enzymatic activity by ~50%, partially impairing thiopurine inactivation. This results in moderately elevated 6-TGN concentrations that may cause clinically significant bone marrow suppression, particularly during early therapy when dose-response relationships are established.",
  },
  {
    gene: "TPMT", drug: "AZATHIOPRINE", phenotype: "NM",
    diplotype_examples: ["*1/*1"],
    risk_label: "Safe", severity: "none", confidence_score: 0.95,
    action: "Standard azathioprine therapy. Follow disease-specific dosing guidelines.",
    dosage_adjustment: "No adjustment required. Standard dosing and routine CBC monitoring appropriate.",
    summary: "Normal TPMT activity. Azathioprine is metabolized at the expected rate with standard myelosuppression risk.",
    mechanism: "Normal TPMT enzymatic activity provides adequate S-methylation inactivation of azathioprine metabolites, maintaining 6-TGN concentrations within the therapeutic window.",
  },

  // ── FLUOROURACIL / DPYD ────────────────────────────────────────────────────
  {
    gene: "DPYD", drug: "FLUOROURACIL", phenotype: "PM",
    diplotype_examples: ["*2A/*2A", "*13/*13", "*2A/*13"],
    risk_label: "Toxic", severity: "critical", confidence_score: 0.98,
    action: "Avoid fluorouracil/capecitabine. Potentially fatal toxicity risk.",
    dosage_adjustment: "Contraindicated. If fluorouracil is the only option, reduce dose by >75% under intensive hematologic and clinical monitoring in a specialist setting.",
    summary: "DPYD Poor Metabolizer. Near-complete absence of DPYD enzyme causes massive 5-FU accumulation, leading to life-threatening GI, hematologic, and neurologic toxicity.",
    mechanism: "DPYD (dihydropyrimidine dehydrogenase) is the primary catabolic enzyme for 5-fluorouracil, metabolizing ~80–85% of systemic 5-FU to inactive DHFU. Loss-of-function variants eliminate this clearance pathway, causing 5-FU systemic exposure to increase 2–4 fold. This results in severe mucositis, neutropenia, hand-foot syndrome, and potentially fatal neurotoxicity.",
  },
  {
    gene: "DPYD", drug: "FLUOROURACIL", phenotype: "IM",
    diplotype_examples: ["*1/*2A", "*1/*13", "*1/HapB3"],
    risk_label: "Adjust Dosage", severity: "high", confidence_score: 0.93,
    action: "Reduce fluorouracil/capecitabine starting dose by 50%. Escalate if tolerated.",
    dosage_adjustment: "Start at 50% of standard dose. If no serious toxicity after Cycle 1, dose may be escalated based on clinical tolerance and PK data. Toxicity monitoring every cycle.",
    summary: "DPYD Intermediate Metabolizer. Reduced DPYD activity substantially elevates 5-FU systemic exposure. A 50% starting dose reduction is mandated by CPIC to prevent severe toxicity.",
    mechanism: "Heterozygous DPYD loss-of-function variants reduce dihydropyrimidine dehydrogenase activity by approximately 50%, impairing the primary 5-FU catabolic pathway. Systemic 5-FU accumulation is intermediate between normal metabolizers and poor metabolizers, requiring significant dose reduction to maintain safety while preserving antitumor efficacy.",
  },
  {
    gene: "DPYD", drug: "FLUOROURACIL", phenotype: "NM",
    diplotype_examples: ["*1/*1"],
    risk_label: "Safe", severity: "none", confidence_score: 0.94,
    action: "Standard fluorouracil therapy. Proceed with standard dosing and monitoring.",
    dosage_adjustment: "No adjustment required. Follow oncology protocol-specific dosing.",
    summary: "Normal DPYD enzymatic activity. 5-FU is metabolized at the expected rate with standard toxicity profile.",
    mechanism: "Normal DPYD activity efficiently catabolizes ~80% of systemic 5-FU to inactive metabolites, maintaining drug concentrations within the standard therapeutic window. Expected toxicity profile per treatment protocol.",
  },
];

// ─── Phenotype Inference Engine ──────────────────────────────────────────────

/**
 * Determine function impact count from detected variants for a gene.
 * Returns [nFunctional, nReduced, nNoFunction] allele counts.
 */
function countAlleleFunctions(
  variants: DetectedVariant[]
): { functional: number; reduced: number; noFunction: number; increased: number } {
  let functional = 0, reduced = 0, noFunction = 0, increased = 0;

  for (const variant of variants) {
    const mapping = RSID_MAPPING.find((m) => m.rsid === variant.rsid);
    if (!mapping) continue;

    // Infer based on GT
    const gt = variant.genotype;
    const alleles = gt.split(/[/|]/);

    for (const allele of alleles) {
      if (allele === mapping.ref) {
        // Reference allele — normal function
        functional++;
      } else if (allele === mapping.alt || (allele !== mapping.ref && allele !== ".")) {
        // Alternate allele — use function impact
        switch (mapping.function_impact) {
          case "no_function":  noFunction++;  break;
          case "reduced":      reduced++;     break;
          case "increased":    increased++;   break;
          case "normal":       functional++;  break;
          default:             functional++;  break;
        }
      }
    }
  }

  // Default: if no variants detected, assume 2 functional alleles
  if (functional === 0 && reduced === 0 && noFunction === 0 && increased === 0) {
    functional = 2;
  }

  return { functional, reduced, noFunction, increased };
}

/**
 * Infer phenotype from allele function counts.
 * Follows standard CPIC phenotype assignment rules.
 */
export function inferPhenotype(gene: GeneName, variants: DetectedVariant[]): Phenotype {
  if (variants.length === 0) return "NM"; // No variants found → Normal Metabolizer

  const { functional, reduced, noFunction, increased } = countAlleleFunctions(variants);

  // Special logic per gene
  switch (gene) {
    case "CYP2D6":
    case "CYP2C19":
    case "CYP2C9":
    case "TPMT":
    case "DPYD": {
      if (noFunction >= 2) return "PM";
      if (noFunction === 1 && reduced >= 1) return "PM";
      if (noFunction === 1 && functional >= 1) return "IM";
      if (reduced >= 2) return "IM";
      if (reduced === 1 && functional >= 1) return "IM";
      if (increased >= 2) return "URM";
      if (increased === 1 && functional >= 1) return "RM";
      return "NM";
    }

    case "SLCO1B1": {
      // SLCO1B1 uses transport function terms
      if (noFunction >= 2 || reduced >= 2) return "PM";
      if (noFunction >= 1 || reduced >= 1) return "IM";
      return "NM";
    }

    default:
      return "Unknown";
  }
}

/**
 * Derive diplotype string from detected variants.
 * Simplified: takes the most impactful detected star alleles.
 */
function inferDiplotype(gene: GeneName, variants: DetectedVariant[]): string {
  if (variants.length === 0) {
    // Wildtype
    return gene === "SLCO1B1" ? "*1a/*1a" : "*1/*1";
  }

  const starAlleles = variants
    .map((v) => {
      const mapping = RSID_MAPPING.find((m) => m.rsid === v.rsid);
      if (!mapping) return null;
      const gt = v.genotype.split(/[/|]/);
      const hasAlt = gt.some((a) => a !== mapping.ref && a !== ".");
      return hasAlt ? mapping.star_allele_alt : null;
    })
    .filter(Boolean) as string[];

  const uniqueAlleles = [...new Set(starAlleles)];
  const wildtype = gene === "SLCO1B1" ? "*1a" : "*1";

  if (uniqueAlleles.length === 0) return `${wildtype}/${wildtype}`;
  if (uniqueAlleles.length === 1) return `${wildtype}/${uniqueAlleles[0]}`;
  return `${uniqueAlleles[0]}/${uniqueAlleles[1]}`;
}

// ─── Report Generation ──────────────────────────────────────────────────────

/**
 * Generate a PharmacogenomicReport for a single gene-drug pair.
 */
function generateReport(
  patientId: string,
  gene: GeneName,
  variants: DetectedVariant[],
  totalVariants: number
): PharmacogenomicReport {
  const drug = GENE_TO_DRUG[gene];
  const phenotype = inferPhenotype(gene, variants);
  const diplotype = inferDiplotype(gene, variants);

  // Find matching CPIC rule
  const rule = CPIC_RULES.find(
    (r) => r.gene === gene && r.drug === drug && r.phenotype === phenotype
  ) ?? CPIC_RULES.find((r) => r.gene === gene && r.drug === drug && r.phenotype === "NM")!;

  return {
    patient_id: patientId,
    drug,
    timestamp: new Date().toISOString(),
    risk_assessment: {
      risk_label: rule?.risk_label ?? "Unknown",
      confidence_score: variants.length > 0 ? (rule?.confidence_score ?? 0.5) : 0.72,
      severity: rule?.severity ?? "none",
    },
    pharmacogenomic_profile: {
      primary_gene: gene,
      diplotype,
      phenotype,
      detected_variants: variants,
    },
    clinical_recommendation: {
      action: rule?.action ?? "No CPIC guideline available for this variant combination.",
      dosage_adjustment: rule?.dosage_adjustment ?? "Consult pharmacogenomics specialist.",
    },
    llm_generated_explanation: {
      summary: rule?.summary ?? `No specific pharmacogenomic variant detected for ${gene}. Standard dosing applies.`,
      mechanism: rule?.mechanism ?? `${gene} encodes a key drug-metabolizing enzyme. No actionable variant was identified in this analysis.`,
    },
    quality_metrics: {
      vcf_parsing_success: true,
      total_variants_parsed: totalVariants,
      target_variants_found: variants.length,
    },
  };
}

/**
 * Main analysis entry point.
 * Takes a VCFParseResult and generates one PharmacogenomicReport per target gene.
 */
export function analyzeVCF(
  parseResult: VCFParseResult,
  patientId?: string
): PharmacogenomicReport[] {
  const pid = patientId ?? parseResult.sampleId ?? "PATIENT_001";

  return TARGET_GENES.map((gene) => {
    const variants = parseResult.variantsByGene.get(gene) ?? [];
    return generateReport(pid, gene, variants, parseResult.totalVariants);
  });
}

/**
 * Phenotype full label lookup
 */
export const PHENOTYPE_LABELS: Record<Phenotype, string> = {
  PM: "Poor Metabolizer",
  IM: "Intermediate Metabolizer",
  NM: "Normal Metabolizer",
  RM: "Rapid Metabolizer",
  URM: "Ultra-Rapid Metabolizer",
  Unknown: "Unknown Phenotype",
};

/**
 * Severity color mapping for UI
 */
export const SEVERITY_CONFIG = {
  none:     { label: "None",     colorClass: "text-risk-safe",     bgClass: "bg-[hsl(var(--risk-safe-bg))]",     dotClass: "bg-risk-safe" },
  low:      { label: "Low",      colorClass: "text-risk-adjust",   bgClass: "bg-[hsl(var(--risk-adjust-bg))]",   dotClass: "bg-risk-adjust" },
  moderate: { label: "Moderate", colorClass: "text-risk-adjust",   bgClass: "bg-[hsl(var(--risk-adjust-bg))]",   dotClass: "bg-risk-adjust" },
  high:     { label: "High",     colorClass: "text-risk-toxic",    bgClass: "bg-[hsl(var(--risk-toxic-bg))]",    dotClass: "bg-risk-toxic" },
  critical: { label: "Critical", colorClass: "text-risk-critical", bgClass: "bg-[hsl(var(--risk-critical-bg))]", dotClass: "bg-risk-critical" },
} as const;

export const RISK_LABEL_CONFIG = {
  "Safe":          { colorClass: "text-risk-safe",     bgClass: "bg-[hsl(var(--risk-safe-bg))]",     borderClass: "border-risk-safe",     icon: "✓", shadow: "shadow-risk-safe" },
  "Adjust Dosage": { colorClass: "text-risk-adjust",   bgClass: "bg-[hsl(var(--risk-adjust-bg))]",   borderClass: "border-risk-adjust",   icon: "⚠", shadow: "shadow-risk-adjust" },
  "Toxic":         { colorClass: "text-risk-critical", bgClass: "bg-[hsl(var(--risk-critical-bg))]", borderClass: "border-risk-critical", icon: "✕", shadow: "shadow-risk-toxic" },
  "Ineffective":   { colorClass: "text-risk-toxic",    bgClass: "bg-[hsl(var(--risk-toxic-bg))]",    borderClass: "border-risk-toxic",    icon: "⊘", shadow: "shadow-risk-toxic" },
  "Unknown":       { colorClass: "text-risk-unknown",  bgClass: "bg-[hsl(var(--risk-unknown-bg))]",  borderClass: "border-risk-unknown",  icon: "?", shadow: "" },
} as const;
