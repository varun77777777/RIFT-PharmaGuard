import { ParsedVCF } from "@/lib/types"

export function validateVCF(vcf: ParsedVCF) {
  if (!vcf.header.some(h => h.includes("fileformat=VCF"))) {
    throw new Error("Invalid VCF header")
  }

  if (!vcf.records.length) {
    throw new Error("VCF contains no variants")
  }

  vcf.records.forEach(r => {
    if (!r.CHROM || !r.POS || !r.GT) {
      throw new Error("Malformed VCF record detected")
    }
  })

  return true
}
