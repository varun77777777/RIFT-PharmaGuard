export function classifyPhenotype(diplotype: string): string {
  if (diplotype === "*2/*2") return "Poor Metabolizer"
  if (diplotype === "*1/*2") return "Intermediate Metabolizer"
  if (diplotype === "*1/*1") return "Normal Metabolizer"
  return "Indeterminate"
}
