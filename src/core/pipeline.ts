import { ParsedVCF, GeneResult } from "@/lib/types"
import { validateVCF } from "./validation/vcfValidator"
import { REQUIRED_GENES } from "./genes/geneConfig"
import { inferDiplotype } from "./genes/diplotypeEngine"
import { classifyPhenotype } from "./genes/phenotypeEngine"
import { getDrugRisk } from "./drugs/drugRiskEngine"
import { getCPICRecommendation } from "./drugs/cpicEngine"
import { generateReport } from "./schema/jsonSchemaGenerator"

export function processVCF(vcf: ParsedVCF, patientId: string) {
  validateVCF(vcf)

  const foundGenes = Array.from(
    new Set(vcf.records.map(r => r.CHROM))
  )

  const missing = REQUIRED_GENES.filter(g => !foundGenes.includes(g))
  if (missing.length) {
    throw new Error(`Missing required genes: ${missing.join(", ")}`)
  }

  const results: GeneResult[] = REQUIRED_GENES.map(gene => {
    const record = vcf.records.find(r => r.CHROM === gene)

    const diplotype = inferDiplotype(record?.GT || "")
    const phenotype = classifyPhenotype(diplotype)
    const risk = getDrugRisk(gene, phenotype)
    const cpic = getCPICRecommendation(gene, phenotype)

    return {
      gene,
      diplotype,
      phenotype,
      risk,
      cpicRecommendation: cpic
    }
  })

  return generateReport(patientId, results)
}
