export interface ClassificationResult {
  url: string
  accepts_visa: boolean
  visa_evidence: string
  sells_adderall: boolean
  adderall_evidence: string
  is_licensed_pharmacy: boolean
  license_evidence: string
  is_violation: boolean
  confidence: 'high' | 'medium' | 'low'
  risk_score: number
  reasoning: string
  needs_manual_review: boolean
  classifiedAt: string
}

export interface StatsData {
  total: number
  violations: number
  highConfidence: number
  needsReview: number
}
