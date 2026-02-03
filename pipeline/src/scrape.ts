/**
 * Scrape Module - Uses BrightData Scraping Browser to extract evidence
 */

import puppeteer, { type Page } from 'puppeteer-core';
import * as dotenv from 'dotenv';
import { ScrapedSite, SearchResult } from './types';
import * as fs from 'fs';

dotenv.config();

const BRIGHTDATA_USER = process.env.BRIGHTDATA_USER;
const BRIGHTDATA_PASSWORD = process.env.BRIGHTDATA_PASSWORD;

if (!BRIGHTDATA_USER || !BRIGHTDATA_PASSWORD) {
  throw new Error('BrightData credentials not found in .env file');
}

// BrightData Scraping Browser WebSocket endpoint
const BRIGHTDATA_WSS = `wss://${BRIGHTDATA_USER}:${BRIGHTDATA_PASSWORD}@brd.superproxy.io:9222`;

const MAX_EVIDENCE_ITEMS = 6;
const PAGE_WAIT_MS = 2000;
const CONNECT_TIMEOUT_MS = 15000;
const NAVIGATION_TIMEOUT_MS = 25000;
const OPERATION_TIMEOUT_MS = 15000;

function formatElapsedSeconds(startTimeMs: number): number {
  return Math.max(0, Math.round((Date.now() - startTimeMs) / 1000));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms during ${label}`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

function extractEvidenceFromText(text: string, keywords: string[]): string[] {
  const lines = text
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);

  const matches: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (keywords.some(keyword => lower.includes(keyword))) {
      matches.push(line);
      if (matches.length >= MAX_EVIDENCE_ITEMS) {
        break;
      }
    }
  }

  return matches;
}

function extractEvidence(content: string, html: string): ScrapedSite['evidence'] {
  const paymentKeywords = [
    'visa',
    'mastercard',
    'credit card',
    'payment methods',
    'checkout',
    'accepted cards',
  ];
  const productKeywords = [
    'adderall',
    'amphetamine',
    'dextroamphetamine',
    'adderall xr',
    'generic adderall',
    'add to cart',
    'price',
    'mg',
  ];
  const licensingKeywords = [
    'dea',
    'nabp',
    'vipps',
    'pharmacy license',
    'licensed pharmacy',
    'prescription required',
    'no prescription',
    'rx required',
    'upload prescription',
  ];

  const payment = extractEvidenceFromText(content, paymentKeywords);
  const product = extractEvidenceFromText(content, productKeywords);
  const licensing = extractEvidenceFromText(content, licensingKeywords);

  const htmlLower = html.toLowerCase();
  if (payment.length === 0 && htmlLower.includes('visa')) {
    payment.push('Visa keyword found in HTML (possible logo or payment icon).');
  }

  return { payment, product, licensing };
}

function mergeEvidence(
  base: ScrapedSite['evidence'],
  additional: Partial<ScrapedSite['evidence']> = {}
): ScrapedSite['evidence'] {
  const payment = new Set([...(base?.payment || []), ...(additional.payment || [])]);
  const product = new Set([...(base?.product || []), ...(additional.product || [])]);
  const licensing = new Set([...(base?.licensing || []), ...(additional.licensing || [])]);

  return {
    payment: Array.from(payment).slice(0, MAX_EVIDENCE_ITEMS),
    product: Array.from(product).slice(0, MAX_EVIDENCE_ITEMS),
    licensing: Array.from(licensing).slice(0, MAX_EVIDENCE_ITEMS),
  };
}

async function extractPaymentEvidenceFromDom(page: Page, label: string): Promise<string[]> {
  const rawEvidence = await page.evaluate(() => {
    const documentRef = (globalThis as any).document;
    const results: string[] = [];
    const imgSelectors = [
      'img[src*="visa"]',
      'img[alt*="visa"]',
      'img[src*="mastercard"]',
      'img[alt*="mastercard"]',
      'img[src*="amex"]',
      'img[alt*="amex"]',
      'img[src*="discover"]',
      'img[alt*="discover"]',
    ];
    const textSelectors = [
      '.payment-methods',
      '.accepted-cards',
      '.checkout-icons',
      '.woocommerce-checkout-payment',
      '.woocommerce-checkout-review-order',
    ];

    imgSelectors.forEach(selector => {
      documentRef.querySelectorAll(selector).forEach((node: any) => {
        const src = node.getAttribute?.('src') || '';
        const alt = node.getAttribute?.('alt') || '';
        const labelParts = [];
        if (alt) labelParts.push(`alt="${alt}"`);
        if (src) labelParts.push(`src="${src}"`);
        if (labelParts.length > 0) {
          results.push(labelParts.join(' '));
        }
      });
    });

    textSelectors.forEach(selector => {
      documentRef.querySelectorAll(selector).forEach((node: any) => {
        const text = (node.textContent || '').trim();
        if (text) {
          results.push(text);
        }
      });
    });

    return Array.from(new Set(results)).slice(0, 10);
  });

  return rawEvidence.map((item: string) => `[${label}] ${item}`).slice(0, MAX_EVIDENCE_ITEMS);
}

function extractPaymentEvidenceFromHtml(html: string, label: string): string[] {
  const htmlLower = html.toLowerCase();
  if (htmlLower.includes('visa')) {
    return [`[${label}] Visa keyword found in HTML (possible logo or payment icon).`];
  }
  return [];
}

async function tryAddToCart(page: Page): Promise<boolean> {
  const selectors = [
    'button[name="add-to-cart"]',
    'button.single_add_to_cart_button',
    'button.add_to_cart_button',
    'a.add_to_cart_button',
    'form.cart button[type="submit"]',
  ];

  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      try {
        await element.click({ delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 1500));
        return true;
      } catch {
        // Try next selector
      }
    }
  }

  return false;
}

/**
 * Scrape a single URL via BrightData proxy
 */
async function scrapeSite(url: string): Promise<ScrapedSite> {
  console.log(`🌐 Scraping: ${url}`);

  let browser;
  try {
    // Connect to BrightData Scraping Browser
    console.log('  ⏳ Connecting to browser...');
    browser = await withTimeout(
      puppeteer.connect({ browserWSEndpoint: BRIGHTDATA_WSS }),
      CONNECT_TIMEOUT_MS,
      'browser connect'
    );

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(OPERATION_TIMEOUT_MS);

    // Set realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate with timeout
    console.log('  ⏳ Loading page...');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    // Wait a bit for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, PAGE_WAIT_MS));

    // Extract page data
    const title = await withTimeout(page.title(), OPERATION_TIMEOUT_MS, 'page title');

    // Get main text content (body text without scripts/styles)
    const content = await withTimeout(
      page.evaluate(() => {
        // Remove script and style tags
        const documentRef = (globalThis as any).document;
        const scripts = documentRef.querySelectorAll('script, style, noscript');
        scripts.forEach((el: any) => el.remove());

        return documentRef.body?.innerText || '';
      }),
      OPERATION_TIMEOUT_MS,
      'content extraction'
    );

    // Get full HTML for later analysis if needed
    const html = await withTimeout(page.content(), OPERATION_TIMEOUT_MS, 'page content');
    let evidence = extractEvidence(content, html);
    const landingDomEvidence = await extractPaymentEvidenceFromDom(page, 'landing');
    const landingHtmlEvidence = extractPaymentEvidenceFromHtml(html, 'landing');
    evidence = mergeEvidence(evidence, { payment: [...landingDomEvidence, ...landingHtmlEvidence] });

    const baseUrl = new URL(url);
    const cartUrl = new URL('/cart/', baseUrl).toString();
    const checkoutUrl = new URL('/checkout/', baseUrl).toString();

    const addedToCart = await tryAddToCart(page);

    const checkoutTargets = addedToCart ? [cartUrl, checkoutUrl] : [cartUrl, checkoutUrl];
    for (const targetUrl of checkoutTargets) {
      try {
        await page.goto(targetUrl, {
          waitUntil: 'domcontentloaded',
          timeout: NAVIGATION_TIMEOUT_MS,
        });
        await new Promise(resolve => setTimeout(resolve, PAGE_WAIT_MS));
        const checkoutHtml = await withTimeout(
          page.content(),
          OPERATION_TIMEOUT_MS,
          'checkout content'
        );
        const checkoutDomEvidence = await extractPaymentEvidenceFromDom(page, targetUrl);
        const checkoutHtmlEvidence = extractPaymentEvidenceFromHtml(checkoutHtml, targetUrl);
        evidence = mergeEvidence(evidence, {
          payment: [...checkoutDomEvidence, ...checkoutHtmlEvidence],
        });
      } catch {
        // Ignore checkout navigation failures and continue
      }
    }

    console.log(`  ✓ Scraped successfully (${content.length} chars)`);

    await browser.close();

    return {
      url,
      title,
      content: content.trim(),
      html,
      evidence,
      scrapedAt: new Date().toISOString(),
    };

  } catch (error: any) {
    console.error(`  ✗ Error scraping ${url}:`, error.message);

    if (browser) {
      await browser.close();
    }

    return {
      url,
      title: '',
      content: '',
      evidence: { payment: [], product: [], licensing: [] },
      scrapedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Scrape multiple sites with rate limiting
 */
async function scrapeMultipleSites(
  searchResults: SearchResult[],
  options: { limit?: number; delayMs?: number } = {}
): Promise<ScrapedSite[]> {
  const { limit = 20, delayMs = 3000 } = options;

  console.log(`🚀 Starting scraping phase...`);
  console.log(`📊 Will scrape ${Math.min(limit, searchResults.length)} of ${searchResults.length} sites\n`);

  const scrapedSites: ScrapedSite[] = [];
  const sitesToScrape = searchResults.slice(0, limit);
  const startedAt = Date.now();

  for (let i = 0; i < sitesToScrape.length; i++) {
    const result = sitesToScrape[i];

    console.log(`[${i + 1}/${sitesToScrape.length}] ⏱️  Elapsed: ${formatElapsedSeconds(startedAt)}s`);
    const scraped = await scrapeSite(result.url);
    scrapedSites.push(scraped);

    // Rate limiting: delay between requests
    if (i < sitesToScrape.length - 1) {
      console.log(`  ⏱️  Waiting ${delayMs / 1000}s before next request...\n`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  const successful = scrapedSites.filter(s => !s.error).length;
  const failed = scrapedSites.filter(s => s.error).length;

  console.log(`\n✅ Scraping complete:`);
  console.log(`  Success: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total time: ${formatElapsedSeconds(startedAt)}s`);

  return scrapedSites;
}

/**
 * Main entry point - run when executed directly
 */
async function main() {
  try {
    // Load search results
    const searchResultsPath = './data/search-results.json';

    if (!fs.existsSync(searchResultsPath)) {
      console.error('❌ Search results not found. Run `npm run search` first.');
      process.exit(1);
    }

    const searchResults: SearchResult[] = JSON.parse(
      fs.readFileSync(searchResultsPath, 'utf-8')
    );

    console.log(`📥 Loaded ${searchResults.length} search results\n`);

    // Scrape first 20 sites
    const scrapedSites = await scrapeMultipleSites(searchResults, {
      limit: 20,
      delayMs: 3000,  // 3 seconds between requests
    });

    // Display summary
    console.log('\n📋 Scraped Sites Summary:');
    scrapedSites.forEach((site, idx) => {
      console.log(`\n${idx + 1}. ${site.title || '(No title)'}`);
      console.log(`   URL: ${site.url}`);
      console.log(`   Status: ${site.error ? '❌ Failed' : '✅ Success'}`);
      if (site.error) {
        console.log(`   Error: ${site.error}`);
      } else {
        console.log(`   Content: ${site.content.substring(0, 100)}...`);
      }
    });

    // Save results
    const outputPath = './data/scraped-results.json';
    fs.writeFileSync(outputPath, JSON.stringify(scrapedSites, null, 2));
    console.log(`\n💾 Results saved to ${outputPath}`);

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { scrapeSite, scrapeMultipleSites };
