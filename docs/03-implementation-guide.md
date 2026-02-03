# Implementation Guide

## Phase 1: Search Discovery (src/search.ts)

### Goal
Query SerpApi to find potential violating sites.

### Implementation

```typescript
import 'dotenv/config';

interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
}

const SEARCH_QUERIES = [
  '"buy adderall online" "visa" "no prescription"',
  '"adderall" "accept credit card" "overnight shipping"',
  '"order adderall" "mastercard visa" "discreet"',
  '"generic adderall" "online pharmacy" "visa accepted"',
  '"adderall 30mg" "pay with card" -cvs -walgreens -walmart'
];

export async function searchGoogle(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    api_key: process.env.SERPAPI_KEY!,
    engine: 'google',
    num: '20',
    gl: 'us',  // US results
    hl: 'en'   // English
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);

  if (!response.ok) {
    throw new Error(`SerpApi error: ${response.status}`);
  }

  const data = await response.json();
  return data.organic_results || [];
}

export async function discoverUrls(): Promise<string[]> {
  const allUrls = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    console.log(`Searching: ${query}`);
    try {
      const results = await searchGoogle(query);
      results.forEach(r => allUrls.add(r.link));
      console.log(`  Found ${results.length} results`);
    } catch (err) {
      console.error(`  Error: ${err}`);
    }
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return Array.from(allUrls);
}

// Run standalone
if (require.main === module) {
  discoverUrls().then(urls => {
    console.log(`\nTotal unique URLs: ${urls.length}`);
    urls.forEach(u => console.log(u));
  });
}
```

### Key Considerations
- Deduplicate URLs across queries
- Exclude known legitimate pharmacies (CVS, Walgreens, etc.)
- Handle rate limits with delays
- Log progress for debugging

---

## Phase 2: Web Scraping (src/scrape.ts)

### Goal
Scrape each discovered URL using BrightData Scraping Browser (with proxy).

### Implementation

```typescript
import 'dotenv/config';
import puppeteer, { Browser } from 'puppeteer-core';

interface ScrapedSite {
  url: string;
  title: string;
  html: string;
  text: string;
  screenshotBase64?: string;
  paymentImages: string[];
  error?: string;
  scrapedAt: string;
}

const BRIGHTDATA_WS_ENDPOINT = `wss://${process.env.BRIGHTDATA_USERNAME}:${process.env.BRIGHTDATA_PASSWORD}@brd.superproxy.io:9222`;

export async function scrapeSite(url: string): Promise<ScrapedSite> {
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: BRIGHTDATA_WS_ENDPOINT
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Extract data
    const title = await page.title();
    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || '');

    // Find payment-related images
    const paymentImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => {
          const src = img.src.toLowerCase();
          const alt = img.alt.toLowerCase();
          return src.includes('visa') || src.includes('payment') ||
                 src.includes('card') || alt.includes('visa') ||
                 alt.includes('payment');
        })
        .map(img => img.src);
    });

    // Optional: Take screenshot for evidence
    const screenshot = await page.screenshot({ encoding: 'base64' });

    return {
      url,
      title,
      html,
      text: text.slice(0, 50000), // Limit text size
      screenshotBase64: screenshot as string,
      paymentImages,
      scrapedAt: new Date().toISOString()
    };

  } catch (err) {
    return {
      url,
      title: '',
      html: '',
      text: '',
      paymentImages: [],
      error: String(err),
      scrapedAt: new Date().toISOString()
    };
  } finally {
    if (browser) await browser.close();
  }
}

export async function scrapeAll(urls: string[]): Promise<ScrapedSite[]> {
  const results: ScrapedSite[] = [];

  for (const url of urls) {
    console.log(`Scraping: ${url}`);
    const result = await scrapeSite(url);
    results.push(result);

    if (result.error) {
      console.log(`  Error: ${result.error}`);
    } else {
      console.log(`  Title: ${result.title}`);
      console.log(`  Payment images: ${result.paymentImages.length}`);
    }
  }

  return results;
}
```

### BrightData Connection Notes
- Scraping Browser endpoint: `wss://USERNAME:PASSWORD@brd.superproxy.io:9222`
- Handles JavaScript rendering automatically
- Manages proxies/rotation automatically
- Has built-in CAPTCHA solving

---

## Phase 3: LLM Classification (src/classify.ts)

### Goal
Use OpenAI to determine if scraped sites meet violation criteria.

### Implementation

```typescript
import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Classification {
  url: string;
  accepts_visa: boolean;
  visa_evidence: string;
  sells_adderall: boolean;
  adderall_evidence: string;
  is_licensed_pharmacy: boolean;
  license_evidence: string;
  is_violation: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

const SYSTEM_PROMPT = `You are an analyst detecting Visa payment network abuse for illegal drug sales.

VIOLATION CRITERIA (ALL three must be true for a violation):
1. Site accepts Visa as a payment method
2. Site sells Adderall (amphetamine) - a controlled substance
3. Site is NOT a licensed/legitimate pharmacy

IMPORTANT DISTINCTIONS:
- Legitimate pharmacies (CVS, Walgreens, licensed online pharmacies) = NOT a violation
- News articles about Adderall = NOT a violation
- Sites selling Adderall without prescription + accepting Visa = VIOLATION

Analyze the provided website content and respond with JSON only.`;

const USER_PROMPT = (url: string, content: string) => `
URL: ${url}

WEBSITE CONTENT:
${content.slice(0, 15000)}

Analyze this website for Visa payment network violations. Respond with this exact JSON structure:
{
  "accepts_visa": boolean,
  "visa_evidence": "quote specific text or describe visual elements",
  "sells_adderall": boolean,
  "adderall_evidence": "quote specific product listings or text",
  "is_licensed_pharmacy": boolean,
  "license_evidence": "describe evidence of legitimacy or lack thereof",
  "is_violation": boolean,
  "confidence": "high|medium|low",
  "reasoning": "2-3 sentence explanation"
}`;

export async function classifySite(url: string, text: string): Promise<Classification> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',  // Most capable model
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT(url, text) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1  // Low temp for consistency
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);

    return { url, ...result };

  } catch (err) {
    return {
      url,
      accepts_visa: false,
      visa_evidence: '',
      sells_adderall: false,
      adderall_evidence: '',
      is_licensed_pharmacy: false,
      license_evidence: '',
      is_violation: false,
      confidence: 'low',
      reasoning: `Classification error: ${err}`
    };
  }
}

export async function classifyAll(sites: Array<{ url: string; text: string }>): Promise<Classification[]> {
  const results: Classification[] = [];

  for (const site of sites) {
    console.log(`Classifying: ${site.url}`);
    const result = await classifySite(site.url, site.text);
    results.push(result);
    console.log(`  Violation: ${result.is_violation} (${result.confidence})`);
  }

  return results;
}
```

---

## Phase 4: Pipeline Orchestration (src/pipeline.ts)

### Goal
Wire everything together into a single runnable pipeline.

```typescript
import 'dotenv/config';
import * as fs from 'fs';
import { discoverUrls } from './search';
import { scrapeAll } from './scrape';
import { classifyAll } from './classify';

interface PipelineResult {
  url: string;
  title: string;
  classification: any;
  screenshot?: string;
  scrapedAt: string;
}

async function runPipeline() {
  console.log('=== Starting Pipeline ===\n');

  // Step 1: Search
  console.log('Step 1: Discovering URLs...');
  const urls = await discoverUrls();
  console.log(`Found ${urls.length} unique URLs\n`);

  // Step 2: Scrape
  console.log('Step 2: Scraping sites...');
  const scraped = await scrapeAll(urls.slice(0, 20)); // Limit for time
  const successful = scraped.filter(s => !s.error);
  console.log(`Scraped ${successful.length}/${urls.length} sites\n`);

  // Step 3: Classify
  console.log('Step 3: Classifying with LLM...');
  const classifications = await classifyAll(
    successful.map(s => ({ url: s.url, text: s.text }))
  );

  // Step 4: Combine results
  const results: PipelineResult[] = successful.map((site, i) => ({
    url: site.url,
    title: site.title,
    classification: classifications[i],
    screenshot: site.screenshotBase64,
    scrapedAt: site.scrapedAt
  }));

  // Step 5: Save results
  fs.writeFileSync(
    'data/results.json',
    JSON.stringify(results, null, 2)
  );

  // Summary
  const violations = results.filter(r => r.classification.is_violation);
  console.log('\n=== Pipeline Complete ===');
  console.log(`Total sites: ${results.length}`);
  console.log(`Violations found: ${violations.length}`);
  violations.forEach(v => {
    console.log(`  - ${v.url} (${v.classification.confidence} confidence)`);
  });
}

runPipeline().catch(console.error);
```

---

## Phase 5: UI Server (src/server.ts)

```typescript
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/api/results', (req, res) => {
  try {
    const data = fs.readFileSync('data/results.json', 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
```

See `04-ui-guide.md` for the HTML/CSS implementation.
