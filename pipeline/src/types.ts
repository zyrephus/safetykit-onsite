/**
 * Shared types for the SafetyKit pipeline
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string; // Which search query found this
}

export interface ScrapedSite {
  url: string;
  title: string;
  content: string; // Main text content
  html?: string; // Optional: full HTML if needed
  evidence?: {
    payment: string[];
    product: string[];
    licensing: string[];
  };
  scrapedAt: string;
  error?: string; // If scraping failed
}

export interface ClassificationResult {
  url: string;

  // The three violation criteria
  accepts_visa: boolean;
  visa_evidence: string;

  sells_adderall: boolean;
  adderall_evidence: string;

  is_licensed_pharmacy: boolean;
  license_evidence: string;

  // Final determination
  is_violation: boolean;
  confidence: 'high' | 'medium' | 'low';
  risk_score: number; // 0-100
  reasoning: string;

  needs_manual_review: boolean;
  classifiedAt: string;
}

export interface PipelineResult {
  search: SearchResult;
  scraped: ScrapedSite;
  classification: ClassificationResult;
}
