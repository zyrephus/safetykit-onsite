# SafetyKit Pipeline

Backend pipeline to detect merchants abusing Visa's payment network for illegal Adderall sales.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run individual components:
```bash
npm run search      # Test SerpApi search
npm run scrape      # Test BrightData scraping
npm run classify    # Test OpenAI classification
```

Scraping notes:
- `npm run scrape` now attempts `/cart/` and `/checkout/` after the landing page to capture payment evidence (e.g., Visa logos).

Optional search configuration:
- `SEARCH_MAX_RESULTS` (default: 50) to cap the number of results saved
- `SEARCH_VALIDATE_URLS` (set to `true`) to enable URL validation via HEAD requests

Run full pipeline:
```bash
npm run pipeline
```

## Data Output

Search-only results are saved to `data/search-results.json`. Full pipeline results are saved to `data/results.json` in this format:
```json
{
  "search": { "title": "...", "url": "...", "snippet": "..." },
  "scraped": {
    "url": "...",
    "content": "...",
    "evidence": {
      "payment": ["..."],
      "product": ["..."],
      "licensing": ["..."]
    }
  },
  "classification": {
    "accepts_visa": true,
    "sells_adderall": true,
    "is_licensed_pharmacy": false,
    "is_violation": true,
    "confidence": "high",
    "reasoning": "..."
  }
}
```
