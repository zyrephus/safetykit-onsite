/**
 * Classify Module - Uses OpenAI GPT-4o to detect violations
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { ClassificationResult, ScrapedSite } from './types';
import * as fs from 'fs';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY not found in .env file');
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

/**
 * Classification prompt based on methodology
 */
function detectForumOrWiki(site: ScrapedSite): string | null {
  const url = site.url.toLowerCase();
  const title = site.title.toLowerCase();
  const content = site.content.toLowerCase();

  const forumDomains = [
    'answers.com',
    'reddit.com',
    'quora.com',
    'stackexchange.com',
    'stackoverflow.com',
    'wikihow.com',
    'wikipedia.org',
  ];

  const matchedDomain = forumDomains.find(domain => url.includes(domain));
  if (matchedDomain) {
    return `Forum/wiki domain detected: ${matchedDomain}`;
  }

  const forumSignals = [
    'add your answer',
    'related questions',
    'ask a question',
    'community guidelines',
    'unanswered',
    'wiki user',
    'leaderboard',
    'top categories',
  ];

  const matchedSignals = forumSignals.filter(signal =>
    title.includes(signal) || content.includes(signal)
  );

  if (matchedSignals.length >= 2) {
    return `Forum/wiki content signals: ${matchedSignals.join(', ')}`;
  }

  return null;
}

/**
 * Classification prompt based on methodology
 */
function buildClassificationPrompt(site: ScrapedSite): string {
  const paymentEvidence = site.evidence?.payment?.join(' | ') || 'None captured';
  const productEvidence = site.evidence?.product?.join(' | ') || 'None captured';
  const licensingEvidence = site.evidence?.licensing?.join(' | ') || 'None captured';

  return `You are analyzing a website for potential Visa payment network violations.

CRITICAL: A site is ONLY violating if ALL THREE criteria are true:
1. Accepts Visa as payment method
2. Sells Adderall (Schedule II controlled substance)
3. Is NOT a licensed/legitimate pharmacy

WEBSITE DATA:
URL: ${site.url}
Title: ${site.title}
Evidence Extracts:
- Payment: ${paymentEvidence}
- Product: ${productEvidence}
- Licensing: ${licensingEvidence}
Content:
${site.content.substring(0, 8000)}

ANALYZE EACH CRITERION:

CRITERION 1 - Accepts Visa:
- Look for: Visa logos, "Visa accepted" text, payment method lists, checkout pages
- Be specific about WHERE you found the evidence
- Examples of strong evidence: "Footer shows Visa/Mastercard logos", "Payment page lists Visa"
- Examples of weak evidence: Generic "credit cards accepted" (could imply Visa but not explicit)

CRITERION 2 - Sells Adderall:
- Look for: Product listings, "Buy Adderall", pricing, add-to-cart buttons, dosage info (10mg, 20mg, 30mg)
- Distinguish between SELLING vs. informational content about Adderall
- Examples of strong evidence: "Product page: Adderall 30mg - $X.XX with Add to Cart"
- Examples of weak evidence: Blog post mentioning Adderall (informational, not sales)

CRITERION 3 - NOT Licensed Pharmacy:
RED FLAGS (suggest NOT licensed):
- "No prescription required/needed"
- Missing DEA/pharmacy license number
- Ships controlled substances internationally without restrictions
- Suspicious/missing contact info
- Generic template design
- Recently registered domain

GREEN FLAGS (suggest licensed - NOT a violation):
- Known pharmacy chain (CVS, Walgreens, etc.)
- DEA registration number visible (format: XX1234563)
- Requires prescription upload
- NABP VIPPS certified
- Established healthcare provider

CONFIDENCE SCORING:
- High (90-100): All criteria have explicit, clear evidence
- Medium (60-89): Some criteria have strong evidence, others moderate/implied
- Low (0-59): Ambiguous evidence, missing key information, or site error/unavailable

RESPONSE REQUIREMENTS:
- Be descriptive. Reasoning should be 2-4 sentences and mention where evidence was found.
- When citing evidence, specify the page/source if known (e.g., "landing page", "checkout", or the URL shown in the evidence labels).
- If evidence is weak or inferred, say so explicitly.

RESPOND WITH VALID JSON (no markdown, no code blocks):
{
  "accepts_visa": true or false,
  "visa_evidence": "Specific quote or element found + where it was found (page/URL)",

  "sells_adderall": true or false,
  "adderall_evidence": "Specific quote or element found + where it was found (page/URL)",

  "is_licensed_pharmacy": true or false,
  "license_evidence": "Evidence found or reason for determination + where it was found (page/URL)",

  "is_violation": true or false,
  "confidence": "high" or "medium" or "low",
  "risk_score": 0-100,
  "reasoning": "2-4 sentence summary with page/source references",
  "needs_manual_review": true or false
}`;
}

/**
 * Classify a single scraped site using GPT-4o
 */
async function classifySite(site: ScrapedSite): Promise<ClassificationResult> {
  console.log(`🤖 Classifying: ${site.url}`);

  const forumEvidence = detectForumOrWiki(site);
  if (forumEvidence) {
    console.log(`  ⏭️  Skipped (forum/wiki detected)`);
    return {
      url: site.url,
      accepts_visa: false,
      visa_evidence: forumEvidence,
      sells_adderall: false,
      adderall_evidence: forumEvidence,
      is_licensed_pharmacy: true,
      license_evidence: forumEvidence,
      is_violation: false,
      confidence: 'low',
      risk_score: 0,
      reasoning: 'Forum/wiki content detected; skipped classification.',
      needs_manual_review: true,
      classifiedAt: new Date().toISOString(),
    };
  }

  // Skip classification if scraping failed
  if (site.error || !site.content) {
    console.log(`  ⏭️  Skipped (scraping failed or no content)`);
    return {
      url: site.url,
      accepts_visa: false,
      visa_evidence: 'No content available',
      sells_adderall: false,
      adderall_evidence: 'No content available',
      is_licensed_pharmacy: true, // Assume licensed if can't verify (conservative)
      license_evidence: 'Cannot determine - no content',
      is_violation: false,
      confidence: 'low',
      risk_score: 0,
      reasoning: site.error || 'No content to analyze',
      needs_manual_review: true,
      classifiedAt: new Date().toISOString(),
    };
  }

  try {
    const prompt = buildClassificationPrompt(site);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Most capable model
      messages: [
        {
          role: 'system',
          content: 'You are an expert analyst detecting illegal drug sales through payment networks. Respond ONLY with valid JSON, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent results
      response_format: { type: 'json_object' }, // Force JSON output
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    const classification = JSON.parse(content);

    console.log(`  ✓ Classified: ${classification.is_violation ? '🚨 VIOLATION' : '✅ Clean'} (${classification.confidence} confidence)`);

    return {
      url: site.url,
      ...classification,
      classifiedAt: new Date().toISOString(),
    };

  } catch (error: any) {
    console.error(`  ✗ Error classifying ${site.url}:`, error.message);

    return {
      url: site.url,
      accepts_visa: false,
      visa_evidence: 'Classification error',
      sells_adderall: false,
      adderall_evidence: 'Classification error',
      is_licensed_pharmacy: true,
      license_evidence: 'Classification error',
      is_violation: false,
      confidence: 'low',
      risk_score: 0,
      reasoning: `Classification failed: ${error.message}`,
      needs_manual_review: true,
      classifiedAt: new Date().toISOString(),
    };
  }
}

/**
 * Classify multiple sites
 */
async function classifyMultipleSites(
  scrapedSites: ScrapedSite[],
  options: { delayMs?: number; limit?: number } = {}
): Promise<ClassificationResult[]> {
  const { delayMs = 1000, limit = 20 } = options;

  console.log(`🚀 Starting classification phase...`);
  const sitesToClassify = scrapedSites.slice(0, limit);
  console.log(`📊 Will classify ${sitesToClassify.length} of ${scrapedSites.length} sites\n`);

  const classifications: ClassificationResult[] = [];

  for (let i = 0; i < sitesToClassify.length; i++) {
    const site = sitesToClassify[i];

    console.log(`[${i + 1}/${sitesToClassify.length}]`);
    const classification = await classifySite(site);
    classifications.push(classification);

    // Small delay to avoid rate limiting
    if (i < sitesToClassify.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // Summary statistics
  const violations = classifications.filter(c => c.is_violation).length;
  const highConfidence = classifications.filter(c => c.confidence === 'high').length;
  const needsReview = classifications.filter(c => c.needs_manual_review).length;

  console.log(`\n✅ Classification complete:`);
  console.log(`  🚨 Violations found: ${violations}`);
  console.log(`  ✅ High confidence: ${highConfidence}`);
  console.log(`  ⚠️  Needs manual review: ${needsReview}`);

  return classifications;
}

/**
 * Main entry point - run when executed directly
 */
async function main() {
  try {
    // Load scraped results
    const scrapedResultsPath = './data/scraped-results.json';

    if (!fs.existsSync(scrapedResultsPath)) {
      console.error('❌ Scraped results not found. Run `npm run scrape` first.');
      process.exit(1);
    }

    const scrapedSites: ScrapedSite[] = JSON.parse(
      fs.readFileSync(scrapedResultsPath, 'utf-8')
    );

    console.log(`📥 Loaded ${scrapedSites.length} scraped sites\n`);

    // Classify first 20 sites
    const classifications = await classifyMultipleSites(scrapedSites, {
      delayMs: 1000, // 1 second between API calls
      limit: 20,
    });

    // Display detailed results
    console.log('\n📋 Classification Results:\n');
    classifications.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.url}`);
      console.log(`   Status: ${result.is_violation ? '🚨 VIOLATION' : '✅ Clean'}`);
      console.log(`   Confidence: ${result.confidence} (risk score: ${result.risk_score})`);
      console.log(`   Accepts Visa: ${result.accepts_visa ? '✓' : '✗'} - ${result.visa_evidence}`);
      console.log(`   Sells Adderall: ${result.sells_adderall ? '✓' : '✗'} - ${result.adderall_evidence}`);
      console.log(`   Licensed Pharmacy: ${result.is_licensed_pharmacy ? '✓' : '✗'} - ${result.license_evidence}`);
      console.log(`   Reasoning: ${result.reasoning}`);
      console.log('');
    });

    // Highlight violations
    const violations = classifications.filter(c => c.is_violation);
    if (violations.length > 0) {
      console.log(`\n🚨 VIOLATIONS DETECTED (${violations.length}):\n`);
      violations.forEach((v, idx) => {
        console.log(`${idx + 1}. ${v.url}`);
        console.log(`   Risk Score: ${v.risk_score}/100`);
        console.log(`   Reasoning: ${v.reasoning}\n`);
      });
    } else {
      console.log('\n✅ No violations detected in this batch.\n');
    }

    // Save results
    const outputPath = './data/classified-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(classifications, null, 2));
    console.log(`💾 Results saved to ${outputPath}`);

  } catch (error) {
    console.error('❌ Classification failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { classifySite, classifyMultipleSites };
