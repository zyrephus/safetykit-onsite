# BrightData Scraping Browser Documentation

> Reference documentation for BrightData Scraping Browser with Puppeteer/Playwright.

## Overview

BrightData Scraping Browser provides:
- Managed browser instances with built-in proxy rotation
- Automatic CAPTCHA solving
- JavaScript rendering
- Anti-bot detection bypass

## Installation

```bash
npm install puppeteer-core
# OR
npm install playwright
```

**Note:** Use `puppeteer-core` (not `puppeteer`) - BrightData provides the browser.

## Connection Endpoints

| Library | Protocol | Host | Port |
|---------|----------|------|------|
| Puppeteer | WebSocket | `brd.superproxy.io` | `9222` |
| Playwright | WebSocket | `brd.superproxy.io` | `9222` |
| Selenium | HTTPS | `brd.superproxy.io` | `9515` |

### Connection URL Format
```
wss://{USERNAME}:{PASSWORD}@brd.superproxy.io:9222
```

## Puppeteer Examples

### Basic Scraping
```javascript
const puppeteer = require('puppeteer-core');

const AUTH = 'YOUR_USERNAME:YOUR_PASSWORD';
const SBR_WS_ENDPOINT = `wss://${AUTH}@brd.superproxy.io:9222`;

async function scrape(url) {
  console.log('Connecting to Scraping Browser...');
  const browser = await puppeteer.connect({
    browserWSEndpoint: SBR_WS_ENDPOINT,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { timeout: 2 * 60 * 1000 });

    // Get page content
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    return { html, text };
  } finally {
    await browser.close();
  }
}
```

### With CAPTCHA Solving
```javascript
const puppeteer = require('puppeteer-core');

const AUTH = process.env.BRIGHTDATA_AUTH || 'USER:PASS';
const TARGET_URL = 'https://example.com';

async function scrapeWithCaptcha(url = TARGET_URL) {
  console.log('Connecting to Browser...');
  const browserWSEndpoint = `wss://${AUTH}@brd.superproxy.io:9222`;
  const browser = await puppeteer.connect({ browserWSEndpoint });

  try {
    const page = await browser.newPage();
    const client = await page.createCDPSession();

    await page.goto(url, { timeout: 2 * 60 * 1000 });

    console.log('Waiting for CAPTCHA to be solved...');
    const { status } = await client.send('Captcha.waitForSolve', {
      detectTimeout: 10 * 1000,
    });
    console.log(`CAPTCHA status: ${status}`);

    const data = await page.content();
    return data;
  } finally {
    await browser.close();
  }
}
```

### Extract Specific Elements
```javascript
async function scrapeProductDetails(url) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${AUTH}@brd.superproxy.io:9222`,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { timeout: 2 * 60 * 1000 });

    // Wait for content to load
    await page.waitForSelector('.product-name', { timeout: 30000 });

    // Extract data
    const productName = await page.$eval('.product-name', el => el.textContent.trim());
    const productPrice = await page.$eval('.product-price', el => el.textContent.trim());

    // Find payment images
    const paymentImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => {
          const src = img.src.toLowerCase();
          const alt = img.alt.toLowerCase();
          return src.includes('visa') || src.includes('payment') ||
                 alt.includes('visa') || alt.includes('card');
        })
        .map(img => img.src);
    });

    return { productName, productPrice, paymentImages };
  } finally {
    await browser.close();
  }
}
```

### Session Inspection
```javascript
async function scrapeWithInspection(url) {
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://${AUTH}@brd.superproxy.io:9222`,
  });

  try {
    const page = await browser.newPage();
    const client = await page.createCDPSession();

    // Get inspection URL for debugging
    const { frameTree: { frame } } = await client.send('Page.getFrameTree');
    const { url: inspectUrl } = await client.send('Page.inspect', {
      frameId: frame.id,
    });
    console.log(`Inspect session at: ${inspectUrl}`);

    await page.goto(url, { timeout: 2 * 60 * 1000 });
    return await page.content();
  } finally {
    await browser.close();
  }
}
```

## Playwright Example

```javascript
const playwright = require('playwright');

const AUTH = 'YOUR_USERNAME:YOUR_PASSWORD';

async function scrapeWithPlaywright(url) {
  const endpointURL = `wss://${AUTH}@brd.superproxy.io:9222`;
  const browser = await playwright.chromium.connectOverCDP(endpointURL);

  try {
    const page = await browser.newPage();
    const client = await page.context().newCDPSession(page);

    await page.goto(url, { timeout: 2 * 60 * 1000 });

    // Wait for CAPTCHA if needed
    const { status } = await client.send('Captcha.waitForSolve', {
      detectTimeout: 10 * 1000,
    });
    console.log(`CAPTCHA status: ${status}`);

    return await page.content();
  } finally {
    await browser.close();
  }
}
```

## Error Handling

```javascript
function getErrorDetails(error) {
  if (error.target?._req?.res) {
    const { statusCode, statusMessage } = error.target._req.res;
    return `Server Error ${statusCode}: ${statusMessage}`;
  }
  return error.message;
}

async function safeScrape(url) {
  try {
    return await scrape(url);
  } catch (error) {
    console.error(getErrorDetails(error));
    return null;
  }
}
```

## Environment Variables

```bash
# .env file
BRIGHTDATA_USERNAME=your_zone_username
BRIGHTDATA_PASSWORD=your_zone_password

# Or combined
BRIGHTDATA_AUTH=username:password
```

## Best Practices

1. **Always close the browser** - Use `finally` blocks
2. **Set appropriate timeouts** - 2 minutes for navigation is recommended
3. **Use `networkidle2`** - More reliable than `networkidle0`
4. **Handle errors gracefully** - Sites may block or timeout
5. **Don't add extra connection options** - Use only the WebSocket endpoint

```javascript
// Good - simple connection
await puppeteer.connect({ browserWSEndpoint: SBR_WS_ENDPOINT });

// Bad - extra options can break connection
await puppeteer.connect({
  browserWSEndpoint: SBR_WS_ENDPOINT,
  ignoreHTTPSErrors: true,  // Don't add this
  slowMo: 100,              // Don't add this
});
```

## Credentials Setup

1. Log in to BrightData dashboard
2. Create a Scraping Browser zone
3. Get your zone username and password
4. Format: `brd-customer-{customer_id}-zone-{zone_name}:{password}`
