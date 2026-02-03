# Methodology: Finding Violating Merchants

## The Challenge
Actors selling controlled substances online adapt quickly. No single search query or heuristic will find all bad actors. This requires an iterative, adversarial mindset.

## Search Strategy

### Phase 1: High-Intent Queries (Start Here)
These target users actively looking to buy without prescriptions:

```javascript
// Core violation queries - highest signal
"buy adderall online no prescription"
"order adderall without prescription"
"adderall no rx required"

// Payment-specific angle
"buy adderall online visa"
"adderall online pharmacy credit card"
"order adderall mastercard visa"

// Geographic + urgency signals
"buy adderall online USA overnight"
"adderall fast shipping no prescription"
"overnight adderall delivery"
```

**Expected Results:** 10-30 results per query, mix of:
- Violating pharmacies (TARGET)
- Forum discussions about where to buy
- Health information sites (filter out)
- Legitimate pharmacy listings (filter out)

### Phase 2: Product-Specific Queries
Target specific formulations and dosages:

```javascript
"adderall 30mg buy online"
"adderall xr online pharmacy"
"generic adderall buy"
"amphetamine salts online"  // Generic chemical name
"dextroamphetamine buy"     // Active ingredient
```

**Why This Works:** Violators often list specific dosages/formulations to appear legitimate.

### Phase 3: Trust/Review Queries
Find sites being recommended in forums:

```javascript
"best online pharmacy adderall" 2024 OR 2025 OR 2026
"where to buy adderall online" site:reddit.com
"legit adderall pharmacy" review
"trusted adderall vendor" forum
```

**Why This Works:** Users share sources in forums; violators often plant fake reviews.

### Phase 4: Adjacent Search Terms
Expand beyond exact matches:

```javascript
"adhd medication online no prescription"
"stimulant medication buy online"
"prescription amphetamine online"
"study drugs" "credit card" "fast shipping"
```

### Query Construction Best Practices

1. **Combine multiple signals:**
   - Product term ("adderall")
   - + Intent ("buy", "order")
   - + Payment ("visa", "credit card")
   - + Red flag ("no prescription", "overnight")

2. **Use quotation marks strategically:**
   - "adderall" - force exact term (avoid ADHD info sites)
   - "no prescription" - exact phrase signals violation intent

3. **Recency filters:**
   - Add year constraints to find active sites
   - Violators shut down and reappear frequently

4. **Avoid over-filtering:**
   - Don't add "illegal" or "scam" - that finds articles ABOUT scams
   - Keep queries close to user search behavior

## Scraping Strategy

### Why Proxies Are Required
- Some sites block datacenter IPs
- Geographic restrictions (US-only pharmacies)
- Rate limiting and bot detection
- Consistent behavior expected by evaluators

### What to Extract
1. **Payment evidence**: Payment icons, checkout pages, "We accept Visa" text
2. **Product evidence**: Product listings, prices, "Adderall" mentions
3. **Legitimacy signals**: DEA license, pharmacy license, "no prescription needed"
4. **Contact info**: Address, phone (often fake or missing)

### Key HTML Selectors to Look For
```javascript
// Payment indicators
'img[src*="visa"]', 'img[alt*="visa"]'
'.payment-methods', '.accepted-cards'
'footer img', '.checkout-icons'

// Product indicators
'.product-title', '.product-name'
'h1', 'h2' // Often contain drug names
'.price', '.add-to-cart'

// Red flags
'no prescription', 'rx not required'
'overnight', 'discreet shipping'
```

## Classification Strategy

### Three-Criteria Validation

For a site to be flagged as violating, **ALL THREE must be TRUE:**

#### 1. Accepts Visa ✓
**Strong Evidence:**
- Visa logo visible (footer, checkout, payment methods section)
- Text: "We accept Visa", "Visa/Mastercard accepted"
- Payment form shows Visa option
- Icons: visa.png, visa-logo.svg, card icons

**Medium Evidence:**
- "All major credit cards accepted" (implies Visa)
- Generic card icons without specific logos
- Payment gateway mentions (Stripe, Square - support Visa)

**Weak/Insufficient:**
- Only mentions "credit cards" generically
- Shows Mastercard/Discover but not Visa explicitly

#### 2. Sells Adderall ✓
**Strong Evidence:**
- Product listings with "Adderall" in title
- Pricing for Adderall products
- "Add to cart" buttons on Adderall pages
- Dosage specifications (10mg, 20mg, 30mg)
- "Adderall XR" or "Generic Adderall" listings

**Medium Evidence:**
- Mentions in product categories/navigation
- Search results for "adderall" on site
- Generic "amphetamine salts" listings

**Weak/Insufficient:**
- Only informational content about Adderall
- News/blog posts mentioning the drug

#### 3. NOT a Licensed Pharmacy ✗
**Strong Evidence of VIOLATION (not licensed):**
- States "no prescription required/needed"
- No DEA registration number visible
- No state pharmacy license displayed
- Ships internationally without restrictions
- Domain registered very recently (<6 months)
- Suspicious contact info (no phone, fake address)
- Generic template website design

**Licensed Pharmacy Indicators (NOT a violation):**
- Known chain: CVS, Walgreens, Rite Aid, etc.
- Displays DEA number (format: XX1234563)
- State Board of Pharmacy verification
- Requires prescription upload
- NABP VIPPS seal (legitimate certification)
- Established domain (5+ years old)

### LLM Prompt Structure

```typescript
const classificationPrompt = `You are analyzing a website for potential Visa payment network violations.

CRITICAL: A site is ONLY violating if ALL THREE criteria are true:
1. Accepts Visa as payment method
2. Sells Adderall (Schedule II controlled substance)
3. Is NOT a licensed/legitimate pharmacy

WEBSITE DATA:
URL: {url}
Title: {title}
Content: {scrapedContent}

ANALYZE EACH CRITERION:

CRITERION 1 - Accepts Visa:
- Look for: Visa logos, "Visa accepted" text, payment method lists, checkout pages
- Be specific about WHERE you found the evidence

CRITERION 2 - Sells Adderall:
- Look for: Product listings, "Buy Adderall", pricing, add-to-cart buttons
- Distinguish between selling vs. informational content

CRITERION 3 - NOT Licensed Pharmacy:
RED FLAGS (suggest NOT licensed):
- "No prescription required"
- Missing DEA/pharmacy license
- Ships controlled substances internationally
- Suspicious/missing contact info
- Generic template design

GREEN FLAGS (suggest licensed - NOT a violation):
- Known pharmacy chain (CVS, Walgreens, etc.)
- DEA registration visible
- Requires prescription
- NABP VIPPS certified

OUTPUT FORMAT (JSON):
{
  "accepts_visa": true/false,
  "visa_evidence": "Specific quote or element found, e.g., 'Footer shows Visa/Mastercard logos'",

  "sells_adderall": true/false,
  "adderall_evidence": "e.g., 'Product page: Adderall 30mg - $X.XX with Add to Cart button'",

  "is_licensed_pharmacy": true/false,
  "license_evidence": "e.g., 'No DEA license, states no prescription needed' OR 'CVS Pharmacy with NABP certification'",

  "is_violation": true/false,  // TRUE only if all three criteria met
  "confidence": "high|medium|low",
  "reasoning": "1-2 sentence summary of why this is/isn't a violation",

  "risk_score": 0-100,  // 100 = definite violation, 0 = clearly legitimate
  "needs_manual_review": true/false  // Flag uncertain cases
}
`;
```

### Confidence Scoring

**High Confidence (90-100%):**
- All three criteria have strong, explicit evidence
- Example: Site says "Buy Adderall, no Rx needed, Visa accepted"

**Medium Confidence (60-89%):**
- Some criteria have strong evidence, others moderate
- Example: Clearly sells Adderall, shows credit cards (not explicitly Visa), no license visible

**Low Confidence (0-59%):**
- Ambiguous evidence or missing key information
- Example: Site mentions Adderall, might accept Visa, unclear if licensed
- **Flag these for manual review**

## Pipeline Execution Strategy

### Starting Small (Prototype Phase)
Don't try to process everything at once. Start with:

1. **2-3 high-intent queries** from Phase 1
2. **Top 10 results per query** (30 total URLs)
3. **Scrape all 30 sites** via BrightData proxy
4. **Classify with GPT-4o** (most capable model)
5. **Review in UI** - did we find violators?

**Expected Outcome:** 2-5 violating sites from 30 URLs (if queries are well-tuned)

### Scaling Up (Production Phase)
Once prototype works:

1. **Expand to 10-15 queries** across all phases
2. **Top 20 results per query** (200-300 URLs)
3. **Deduplicate URLs** (same site may appear multiple times)
4. **Batch scraping** to avoid rate limits
5. **Filter out known legitimate sites** (CVS, Walgreens, health info sites)

### Iteration Loop

```
┌─────────────────────────────────────────┐
│  1. Run 2-3 search queries (start small)│
│         ↓                               │
│  2. Collect top 10 URLs per query       │
│         ↓                               │
│  3. Deduplicate URLs                    │
│         ↓                               │
│  4. Scrape each URL via proxy           │
│         ↓ (cache results)               │
│  5. Classify with LLM (GPT-4o)          │
│         ↓                               │
│  6. Review results in UI                │
│         ↓                               │
│  7. Analyze: Did we find violators?     │
│    - YES: Expand queries, scrape more   │
│    - NO: Refine queries, adjust prompt  │
│         ↓                               │
│  8. Repeat with refined approach        │
└─────────────────────────────────────────┘
```

### URL Filtering Strategy

**Pre-scraping filters** (save time/money):
- Skip known legitimate domains: `cvs.com`, `walgreens.com`, `webmd.com`, `healthline.com`
- Skip news sites: `nytimes.com`, `cnn.com`, `forbes.com`
- Skip social media: `reddit.com`, `facebook.com`, `twitter.com`
- Focus on `.pharmacy`, `.com`, `.net` TLDs

**Post-scraping filters:**
- Sites that returned 404/errors
- Sites with no product listings
- Pure information/blog sites

## Edge Cases to Handle

1. **Site is down** - Log and skip
2. **Cloudflare/bot protection** - BrightData Scraping Browser should handle
3. **Redirect chains** - Follow to final destination
4. **Dynamic content (SPA)** - Scraping Browser executes JS
5. **Non-English content** - LLM can handle, but flag for review
6. **Legitimate pharmacy** - Must NOT flag (CVS, Walgreens, etc.)

## Red Flags for Violations

Strong indicators a site is violating:
- **"No prescription needed/required"** ← Strongest signal
- Ships controlled substances internationally
- No verifiable pharmacy license (no DEA number)
- Anonymous payment options mentioned alongside Visa
- Suspiciously low prices vs. legitimate pharmacies
- Generic/template website design (WooCommerce, Shopify templates)
- Recently registered domain (<1 year)
- No physical address or obviously fake address
- Misspellings, poor grammar (offshore operation)
- "Discreet packaging" emphasis

## Test Cases for Validation

### Known Violator (From Brief)
**URL:** https://shipfromusapharmacy.com/

**Expected Classification:**
```json
{
  "accepts_visa": true,
  "visa_evidence": "[Evidence from site]",
  "sells_adderall": true,
  "adderall_evidence": "[Product listings]",
  "is_licensed_pharmacy": false,
  "license_evidence": "No DEA license, likely unlicensed",
  "is_violation": true,
  "confidence": "high",
  "risk_score": 95
}
```

Use this as a baseline test. If your pipeline can't detect this, something is wrong.

### False Positives to Avoid

**CVS.com, Walgreens.com:**
- Sells Adderall: YES (with prescription)
- Accepts Visa: YES
- Licensed: YES ← This disqualifies them
- **Expected:** `is_violation: false`

**WebMD, Healthline:**
- Informational content about Adderall
- May mention payment (ads)
- No actual sales
- **Expected:** `sells_adderall: false`, `is_violation: false`

### Edge Cases

**Telehealth Services (Cerebral, Done, Klarity):**
- Prescribe Adderall via online consultation
- Accept Visa
- ARE licensed medical services
- **Expected:** `is_violation: false` (legitimate prescription pathway)

**International Pharmacies:**
- May ship Adderall to US
- Accept Visa
- May not have US pharmacy license
- **Needs manual review** - some legitimate, some not

## Success Metrics for Methodology

After running the pipeline, you should see:

✅ **At least 2-3 confirmed violators** from 30-50 URLs
✅ **No false positives** (legitimate pharmacies flagged)
✅ **Clear evidence** for each criterion in UI
✅ **Confidence scores** align with manual review

If you're not finding violators:
- Queries too broad (too many info sites)
- Queries too narrow (missing key terms)
- Classification prompt too strict/lenient
- Need to expand search to more queries

## Final Checklist Before Implementation

- [ ] Understand the three violation criteria
- [ ] Have 5-10 test queries ready (Phase 1 + Phase 2)
- [ ] Know what evidence to look for on scraped pages
- [ ] Have classification prompt structure ready
- [ ] Plan to start small (2-3 queries, 10 results each)
- [ ] Know the known violator URL to test against
