/**
 * Single-site pipeline: scrape + classify a single URL for testing.
 */

import * as fs from 'fs';
import { classifySite } from './classify';
import { scrapeSite } from './scrape';
import type { PipelineResult, SearchResult } from './types';

const OUTPUT_PATH = './data/single-testing.json';

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Empty URL provided.');
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    // If no scheme provided, default to https.
    return new URL(`https://${trimmed}`).toString();
  }
}

async function main() {
  const rawUrl = process.argv[2];

  if (!rawUrl) {
    console.error('❌ Missing URL. Usage: npm run single -- https://example.com');
    process.exit(1);
  }

  const url = normalizeUrl(rawUrl);
  const startedAt = Date.now();

  console.log(`\n🧪 Single-site test pipeline`);
  console.log(`Target: ${url}\n`);

  const search: SearchResult = {
    title: '',
    url,
    snippet: '',
    source: 'single-test',
  };

  const scraped = await scrapeSite(url);
  const classification = await classifySite(scraped);

  const result: PipelineResult = {
    search,
    scraped,
    classification,
  };

  console.log('\n📋 Result Summary:');
  console.log(`  Status: ${classification.is_violation ? '🚨 VIOLATION' : '✅ Clean'}`);
  console.log(`  Confidence: ${classification.confidence} (risk score: ${classification.risk_score})`);
  console.log(`  Accepts Visa: ${classification.accepts_visa ? '✓' : '✗'}`);
  console.log(`  Sells Adderall: ${classification.sells_adderall ? '✓' : '✗'}`);
  console.log(`  Licensed Pharmacy: ${classification.is_licensed_pharmacy ? '✓' : '✗'}`);
  console.log(`  Needs Manual Review: ${classification.needs_manual_review ? 'Yes' : 'No'}`);

  console.log('\n🧾 Full JSON Output:\n');
  console.log(JSON.stringify(result, null, 2));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\n💾 Saved to ${OUTPUT_PATH}`);
  console.log(`⏱️  Completed in ${Math.round((Date.now() - startedAt) / 1000)}s\n`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Single-site pipeline failed:', error);
    process.exit(1);
  });
}
