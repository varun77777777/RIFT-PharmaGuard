import cpicData from "@/data/cpicRecommendations.json"

export function getCPICRecommendation(gene: string, phenotype: string): string {
  return cpicData[gene]?.[phenotype] || "No CPIC Recommendation Available"
}
