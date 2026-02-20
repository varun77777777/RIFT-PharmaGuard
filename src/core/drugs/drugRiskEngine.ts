import drugData from "@/data/drugMappings.json"

export function getDrugRisk(gene: string, phenotype: string): string {
  return drugData[gene]?.[phenotype] || "No Drug Risk Data"
}
