import { FinalReport, GeneResult } from "@/lib/types"

export function generateReport(
  patientId: string,
  results: GeneResult[]
): FinalReport {
  return {
    patientId,
    timestamp: new Date().toISOString(),
    results
  }
}
