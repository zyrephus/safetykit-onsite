# Quick Reference Cheatsheet

## API Endpoints & Credentials

### SerpApi
```
Endpoint: https://serpapi.com/search
Method: GET
Key param: api_key
```

### BrightData Scraping Browser
```
WebSocket: wss://USERNAME:PASSWORD@brd.superproxy.io:9222
Format: wss://{username}:{password}@brd.superproxy.io:9222
```

### OpenAI
```
Model: gpt-4o (most capable)
Endpoint: Handled by SDK
```

## Quick Copy-Paste

### Environment Setup
```bash
npm init -y && npm install typescript ts-node @types/node dotenv puppeteer-core openai express @types/express
```

### .env Template
```
SERPAPI_KEY=
BRIGHTDATA_USERNAME=
BRIGHTDATA_PASSWORD=
OPENAI_API_KEY=
```

### SerpApi Request
```typescript
const params = new URLSearchParams({
  q: query,
  api_key: process.env.SERPAPI_KEY!,
  engine: 'google',
  num: '20'
});
const res = await fetch(`https://serpapi.com/search?${params}`);
const data = await res.json();
const urls = data.organic_results?.map(r => r.link) || [];
```

### BrightData Scrape
```typescript
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.connect({
  browserWSEndpoint: `wss://${process.env.BRIGHTDATA_USERNAME}:${process.env.BRIGHTDATA_PASSWORD}@brd.superproxy.io:9222`
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
const text = await page.evaluate(() => document.body.innerText);
await browser.close();
```

### OpenAI Classification
```typescript
import OpenAI from 'openai';
const openai = new OpenAI();

const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'Analyze for Visa violations...' },
    { role: 'user', content: `URL: ${url}\nContent: ${text}` }
  ],
  response_format: { type: 'json_object' }
});
const result = JSON.parse(response.choices[0].message.content);
```

### Express Server
```typescript
import express from 'express';
const app = express();
app.use(express.static('public'));
app.get('/api/results', (req, res) => {
  res.json(JSON.parse(fs.readFileSync('data/results.json', 'utf-8')));
});
app.listen(3000);
```

## Search Queries (Copy-Paste Ready)

```
"buy adderall online" "visa"
"adderall" "credit card" "no prescription"
"order adderall" "accept visa" "overnight"
"generic adderall" "online pharmacy" "visa accepted"
"adderall 30mg" "buy" "card payment"
"adhd medication" "no rx required" "visa"
```

## Violation Criteria Reminder

✅ **Flag as violation if ALL THREE are true:**
1. Accepts Visa payment
2. Sells Adderall
3. NOT a licensed pharmacy

❌ **Do NOT flag:**
- CVS, Walgreens, legitimate pharmacies
- News articles about Adderall
- Sites that don't sell (just discuss)
- Sites without Visa acceptance evidence

## File Structure
```
src/search.ts    → SerpApi discovery
src/scrape.ts    → BrightData scraping
src/classify.ts  → OpenAI classification
src/pipeline.ts  → Orchestration
src/server.ts    → UI server
public/index.html → Dashboard UI
data/results.json → Output
```

## Run Commands
```bash
npm run search     # Test search alone
npm run scrape     # Test scraping alone
npm run classify   # Test classification alone
npm run pipeline   # Full pipeline
npm run serve      # Start UI server
```
