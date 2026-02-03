# Technical Setup Guide

## Step 1: Initialize Project (5 min)

```bash
# Create project structure
mkdir -p src public data docs

# Initialize Node.js project
npm init -y

# Install dependencies
npm install typescript ts-node @types/node
npm install dotenv
npm install puppeteer-core  # For BrightData Scraping Browser
npm install openai
npm install express @types/express  # For local server

# Initialize TypeScript
npx tsc --init
```

## Step 2: Configure TypeScript

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Step 3: Environment Variables

Create `.env` file (NEVER COMMIT):
```bash
# SerpApi
SERPAPI_KEY=your_serpapi_key_here

# BrightData
BRIGHTDATA_USERNAME=your_username
BRIGHTDATA_PASSWORD=your_password
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=9515

# OpenAI
OPENAI_API_KEY=your_openai_key_here
```

Add to `.gitignore`:
```
node_modules/
.env
dist/
data/*.json
```

## Step 4: Package.json Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "search": "ts-node src/search.ts",
    "scrape": "ts-node src/scrape.ts",
    "classify": "ts-node src/classify.ts",
    "pipeline": "ts-node src/pipeline.ts",
    "serve": "ts-node src/server.ts",
    "dev": "ts-node src/pipeline.ts && ts-node src/server.ts"
  }
}
```

## API Quick Reference

### SerpApi (Google Search)
```typescript
// Using fetch (no SDK needed)
const searchGoogle = async (query: string) => {
  const params = new URLSearchParams({
    q: query,
    api_key: process.env.SERPAPI_KEY!,
    engine: 'google',
    num: '20'  // Results per page
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const data = await response.json();
  return data.organic_results || [];
};
```

### BrightData Scraping Browser
```typescript
import puppeteer from 'puppeteer-core';

const scrapeWithProxy = async (url: string) => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${process.env.BRIGHTDATA_USERNAME}:${process.env.BRIGHTDATA_PASSWORD}@${process.env.BRIGHTDATA_HOST}:${process.env.BRIGHTDATA_PORT}`
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  const content = await page.content();
  const text = await page.evaluate(() => document.body.innerText);

  await browser.close();
  return { html: content, text };
};
```

### OpenAI Classification
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const classifySite = async (content: string, url: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',  // Use most powerful available
    messages: [
      { role: 'system', content: CLASSIFICATION_PROMPT },
      { role: 'user', content: `URL: ${url}\n\nContent:\n${content}` }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};
```

## File Structure After Setup

```
safetykit-onsite/
├── src/
│   ├── search.ts      # SerpApi integration
│   ├── scrape.ts      # BrightData scraping
│   ├── classify.ts    # OpenAI classification
│   ├── pipeline.ts    # Main orchestration
│   └── server.ts      # Express server for UI
├── public/
│   ├── index.html     # Report dashboard
│   └── styles.css     # Styling
├── data/
│   └── results.json   # Output data
├── docs/
│   └── (these files)
├── .env               # API keys (gitignored)
├── .gitignore
├── package.json
└── tsconfig.json
```
