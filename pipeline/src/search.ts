/**
 * Search Module - Uses SerpAPI to find potential violating merchants
 */

import { getJson } from 'serpapi';
import * as dotenv from 'dotenv';
import { SearchResult } from './types';

dotenv.config();

const SERPAPI_KEY = process.env.SERPAPI_KEY;

if (!SERPAPI_KEY) {
  throw new Error('SERPAPI_KEY not found in .env file');
}

/**
 * High-precision queries: product + intent + payment + red-flag signals.
 * We append negative operators to suppress obvious noise.
 */
const BASE_QUERIES = [
  '"buy adderall online" "no prescription" "visa"',
  '"order adderall" "no prescription" "credit card"',
  '"adderall" "add to cart" "online pharmacy"',
  '"adderall xr" "buy online" "visa"',
  '"generic adderall" "buy" "credit card"',
  '"adderall 30mg" "order online" "visa"',
  '"amphetamine salts" "buy online" "credit card"',
  '"dextroamphetamine" "buy online" "no prescription"',
  '"buy adderall online" "overnight shipping" "credit card"',
];

const NEGATIVE_SITE_OPERATORS = [
  '-site:.edu',
  '-site:.gov',
  '-site:donorbox.org',
  '-site:networkforgood.com',
  '-site:neoncrm.com',
  '-site:onecause.com',
  '-site:givebutter.com',
  '-site:classy.org',
  '-site:answers.com',
  '-site:amazon.com',
  '-site:amazon.co.uk',
  '-site:amazon.ca',
  '-site:amazon.de',
  '-site:amazon.in',
  '-site:ncbi.nlm.nih.gov',
  '-site:nih.gov',
  '-site:springer.com',
  '-site:sciencedirect.com',
  '-site:jstor.org',
  '-site:pubmed.ncbi.nlm.nih.gov',
];

const NEGATIVE_INURL_OPERATORS = [
  '-inurl:donate',
  '-inurl:fundraise',
  '-inurl:fundraising',
  '-inurl:p2p',
  '-inurl:givingday',
  '-inurl:campaign',
];

const NEGATIVE_TEXT_OPERATORS = [
  '-review',
  '-reviews',
  '-forum',
  '-reddit',
  '-blog',
  '-news',
  '-study',
  '-symptoms',
  '-"side effects"',
  '-wikipedia',
  '-webmd',
  '-healthline',
  '-"clinical trial"',
];

const SEARCH_QUERIES = BASE_QUERIES.map(query =>
  `${query} ${NEGATIVE_SITE_OPERATORS.join(' ')} ${NEGATIVE_INURL_OPERATORS.join(' ')} ${NEGATIVE_TEXT_OPERATORS.join(' ')}`.trim()
);

const MAX_RESULTS = Number(process.env.SEARCH_MAX_RESULTS || '100');
const ENABLE_URL_VALIDATION = process.env.SEARCH_VALIDATE_URLS === 'true';
const URL_VALIDATION_TIMEOUT_MS = 5000;
const STRICT_STORE_ONLY = process.env.SEARCH_STRICT_STORE_ONLY !== 'false';

/**
 * Search Google for a query using SerpAPI
 */
async function searchQuery(query: string, numResults: number = 20): Promise<SearchResult[]> {
  console.log(`🔍 Searching: "${query}"`);

  try {
    const response = await getJson({
      engine: 'google',
      q: query,
      api_key: SERPAPI_KEY,
      num: numResults,
      gl: 'us', // Geographic location: United States
      hl: 'en', // Language: English
    });

    const results: SearchResult[] = [];

    // Extract organic search results
    if (response.organic_results) {
      for (const result of response.organic_results) {
        const link = (result.link || '').trim();
        if (!link) continue;
        results.push({
          title: result.title || '',
          url: link,
          snippet: result.snippet || '',
          source: query, // Track which query found this
        });
      }
    }

    console.log(`  ✓ Found ${results.length} results`);
    return results;

  } catch (error) {
    console.error(`  ✗ Error searching "${query}":`, error);
    return [];
  }
}

/**
 * Run all search queries and collect unique URLs
 */
async function runSearch(): Promise<SearchResult[]> {
  console.log('🚀 Starting search phase...\n');

  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Run queries sequentially to avoid rate limiting
  for (const query of SEARCH_QUERIES) {
    const results = await searchQuery(query);

    // Deduplicate by URL
    for (const result of results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        allResults.push(result);
      }
    }

    // Small delay between queries to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ Search complete: ${allResults.length} unique URLs found`);
  console.log(`📊 Breakdown: ${SEARCH_QUERIES.length} queries, ~${Math.round(allResults.length / SEARCH_QUERIES.length)} results per query\n`);

  return allResults;
}

/**
 * Filter out known legitimate domains to reduce noise
 */
function filterLegitimateResults(
  results: SearchResult[],
  options: { includeForums?: boolean } = {}
): SearchResult[] {
  const { includeForums = false } = options;
  const legitimateDomains = [
    'cvs.com',
    'walgreens.com',
    'riteaid.com',
    'webmd.com',
    'healthline.com',
    'mayoclinic.org',
    'nih.gov',
    'fda.gov',
    'nytimes.com',
    'cnn.com',
    'forbes.com',
  ];
  const forumDomains = [
    'reddit.com',
    'facebook.com',
    'twitter.com',
    'youtube.com',
  ];

  const blockedDomains = includeForums
    ? legitimateDomains
    : [...legitimateDomains, ...forumDomains];

  const filtered = results.filter(result => {
    const url = result.url.toLowerCase();
    return !blockedDomains.some(domain => url.includes(domain));
  });

  const removed = results.length - filtered.length;
  if (removed > 0) {
    console.log(`🧹 Filtered out ${removed} known legitimate/info sites`);
  }

  return filtered;
}

/**
 * Filter out common spam/fundraising/blog/news noise by domain, path, and snippet/title.
 */
function filterNoiseResults(results: SearchResult[]): SearchResult[] {
  const blockedDomainFragments = [
    'givingday',
    'neoncrm',
    'networkforgood',
    'onecause',
    'donorbox',
    'givebutter',
    'classy',
    'answers.com',
    'fundraise',
    'p2p',
    'amazon.',
    'ncbi.nlm.nih.gov',
    'nih.gov',
    'springer',
    'sciencedirect',
    'jstor',
    'pubmed',
  ];
  const blockedPathFragments = [
    '/donate',
    '/fundraise',
    '/fundraising',
    '/p2p',
    '/givingday',
    '/campaign',
    '/crowdfund',
  ];
  const blockedTextKeywords = [
    'fundraiser',
    'donation',
    'nonprofit',
    'crowdfunding',
    'giving day',
    'charity',
    'blog',
    'news',
    'review',
    'reviews',
    'forum',
    'reddit',
    'symptoms',
    'side effects',
    'dosage',
    'wikipedia',
    'webmd',
    'healthline',
    'telehealth',
    'clinic',
    'consultation',
    'appointment',
    'press release',
    'journal',
    'study',
    'studies',
    'paper',
    'research',
    'clinical trial',
    'systematic review',
    'meta-analysis',
    'university',
    'hospital',
  ];

  const filtered = results.filter(result => {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();

    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      const pathname = parsed.pathname.toLowerCase();

      if (hostname.endsWith('.edu') || hostname.endsWith('.gov')) {
        return false;
      }

      if (blockedDomainFragments.some(fragment => hostname.includes(fragment))) {
        return false;
      }

      if (blockedPathFragments.some(fragment => pathname.includes(fragment))) {
        return false;
      }
    } catch {
      return false;
    }

    if (blockedTextKeywords.some(keyword => title.includes(keyword) || snippet.includes(keyword))) {
      return false;
    }

    return true;
  });

  const removed = results.length - filtered.length;
  if (removed > 0) {
    console.log(`🧹 Filtered out ${removed} fundraising/blog/news results`);
  }

  return filtered;
}

/**
 * Require store/transaction signals and avoid informational results.
 */
function filterStoreResults(results: SearchResult[]): SearchResult[] {
  if (!STRICT_STORE_ONLY) {
    return results;
  }

  const storeSignals = [
    'buy',
    'order',
    'add to cart',
    'cart',
    'checkout',
    'shop',
    'store',
    'price',
    'visa',
    'mastercard',
    'credit card',
    'debit card',
    'payment',
    'shipping',
    'delivery',
    'online pharmacy',
    'pharmacy',
  ];
  const productSignals = [
    'adderall',
    'adderall xr',
    'amphetamine',
    'amphetamine salts',
    'dextroamphetamine',
    'generic adderall',
  ];
  const infoSignals = [
    'review',
    'reviews',
    'forum',
    'reddit',
    'blog',
    'news',
    'study',
    'symptoms',
    'side effects',
    'dosage',
    'wikipedia',
    'webmd',
    'healthline',
    'telehealth',
    'clinic',
    'consultation',
    'appointment',
  ];
  const storePathFragments = [
    '/product',
    '/cart',
    '/checkout',
    '/shop',
    '/store',
    '/buy',
    '/order',
    '/category',
    '/product-category',
  ];

  const filtered = results.filter(result => {
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();
    const url = result.url.toLowerCase();
    const haystack = `${title} ${snippet}`;

    const hasStoreSignal =
      storeSignals.some(term => haystack.includes(term)) ||
      storePathFragments.some(fragment => url.includes(fragment)) ||
      /\$\s?\d/.test(haystack);
    const hasProductSignal =
      productSignals.some(term => haystack.includes(term)) || /\b\d{1,3}\s?mg\b/.test(haystack);
    const hasInfoSignal = infoSignals.some(term => haystack.includes(term));

    return hasStoreSignal && hasProductSignal && !hasInfoSignal;
  });

  const removed = results.length - filtered.length;
  if (removed > 0) {
    console.log(`🧹 Filtered out ${removed} results lacking store signals`);
  }

  return filtered;
}

/**
 * Assign a lightweight quality score to prioritize merchant-like results.
 */
function getQualityScore(result: SearchResult): number {
  const haystack = `${result.title} ${result.snippet} ${result.url}`.toLowerCase();
  const positives = [
    'pharmacy',
    'online pharmacy',
    'checkout',
    'cart',
    'add to cart',
    'visa',
    'credit card',
    'mastercard',
    'overnight',
    'shipping',
    'no prescription',
    'rx',
    'adderall',
    'amphetamine',
    'dextroamphetamine',
    'generic adderall',
    'buy',
    'order',
    'price',
    'delivery',
    'payment',
  ];
  const negatives = [
    'blog',
    'news',
    'review',
    'reviews',
    'forum',
    'reddit',
    'symptoms',
    'side effects',
    'press release',
    'journal',
    'university',
    'hospital',
    'nonprofit',
    'fundraiser',
    'donation',
    'charity',
  ];

  let score = 0;
  positives.forEach(term => {
    if (haystack.includes(term)) score += 2;
  });
  negatives.forEach(term => {
    if (haystack.includes(term)) score -= 3;
  });

  return score;
}

async function validateUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), URL_VALIDATION_TIMEOUT_MS);

  try {
    const headResponse = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!headResponse.ok) {
      return false;
    }

    const contentType = headResponse.headers.get('content-type') || '';
    if (contentType && !contentType.includes('text/html')) {
      return false;
    }

    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function validateUrls(results: SearchResult[]): Promise<SearchResult[]> {
  if (!ENABLE_URL_VALIDATION) {
    return results;
  }

  console.log(`🔎 Validating URLs (timeout ${URL_VALIDATION_TIMEOUT_MS}ms)...`);
  const validated: SearchResult[] = [];

  for (const result of results) {
    const isValid = await validateUrl(result.url);
    if (isValid) {
      validated.push(result);
    }
  }

  const removed = results.length - validated.length;
  if (removed > 0) {
    console.log(`🧹 Filtered out ${removed} URLs that failed validation`);
  }

  return validated;
}

/**
 * Filter out non-page assets (e.g., PDFs) that cannot be scraped or purchased from
 */
function filterNonWebResults(results: SearchResult[]): SearchResult[] {
  const blockedExtensions = new Set([
    '.pdf',
    '.doc',
    '.docx',
    '.ppt',
    '.pptx',
    '.xls',
    '.xlsx',
    '.csv',
    '.txt',
  ]);

  const filtered = results.filter(result => {
    try {
      const url = new URL(result.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      const pathname = url.pathname.toLowerCase();
      return !Array.from(blockedExtensions).some(ext => pathname.endsWith(ext));
    } catch {
      return false;
    }
  });

  const removed = results.length - filtered.length;
  if (removed > 0) {
    console.log(`🧹 Filtered out ${removed} non-web document URLs`);
  }

  return filtered;
}

/**
 * Main entry point - run when executed directly
 */
async function main() {
  try {
    // Run search
    const results = await runSearch();

    // Filter out non-page assets (e.g., PDFs)
    const webOnly = filterNonWebResults(results);

    // Filter out common fundraising/blog/news results
    const deNoised = filterNoiseResults(webOnly);

    // Filter out known legitimate sites
    const filtered = filterLegitimateResults(deNoised, { includeForums: false });

    // Require store/transactional signals
    const storeOnly = filterStoreResults(filtered);

    // Optional URL validation (HEAD/GET)
    const validated = await validateUrls(storeOnly);

    // Sort by quality score and cap results
    const scored = validated
      .map(result => ({ result, score: getQualityScore(result) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.result);

    const capped = MAX_RESULTS > 0 ? scored.slice(0, MAX_RESULTS) : scored;

    // Display results summary
    console.log('📋 Top 20 Results:');
    capped.slice(0, 20).forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Query: "${result.source}"`);
    });

    console.log(`\n💾 Total results to scrape: ${capped.length}`);

    // Save results to a file for next phase
    const fs = require('fs');
    const outputPath = './data/search-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(capped, null, 2));
    console.log(`✅ Results saved to ${outputPath}`);

  } catch (error) {
    console.error('❌ Search failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { runSearch, filterLegitimateResults, searchQuery };
