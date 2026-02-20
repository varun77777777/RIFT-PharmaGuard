export interface VCFRecord {
  CHROM: string
  POS: string
  ID: string
  REF: string
  ALT: string
  INFO: string
  FORMAT: string
  GT: string
}

export interface ParsedVCF {
  header: string[]
  records: VCFRecord[]
}

export interface GeneResult {
  gene: string
  diplotype: string
  phenotype: string
  risk: string
  cpicRecommendation: string
}

export interface FinalReport {
  patientId: string
  timestamp: string
  results: GeneResult[]
}
