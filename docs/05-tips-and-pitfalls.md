# Tips, Pitfalls, and Troubleshooting

## Common Pitfalls

### 1. SerpApi Issues

**Problem:** Empty or no results
```
Solution:
- Check API key is valid
- Ensure query isn't too restrictive
- Check SerpApi dashboard for quota
- Try simpler queries first
```

**Problem:** Getting blocked/rate limited
```
Solution:
- Add delays between requests (1-2 seconds)
- Check remaining API credits
- Use fewer queries, expand later
```

### 2. BrightData Scraping Browser Issues

**Problem:** Connection refused
```
Solution:
- Verify credentials (username:password format)
- Check WebSocket endpoint URL
- Ensure port is correct (9222 for Scraping Browser)
- Try: wss://USERNAME:PASSWORD@brd.superproxy.io:9222
```

**Problem:** Timeout on page load
```
Solution:
- Increase timeout (30000ms → 60000ms)
- Use 'networkidle2' instead of 'networkidle0'
- Some sites genuinely block all traffic - skip them
```

**Problem:** Empty content returned
```
Solution:
- Wait for specific selector before extracting
- Check if site uses client-side rendering (wait longer)
- Try page.waitForSelector() before content extraction
```

### 3. OpenAI Classification Issues

**Problem:** Rate limits
```
Solution:
- Add delays between classification calls
- Use batch processing if available
- Cache results to avoid re-processing
```

**Problem:** JSON parsing errors
```
Solution:
- Use response_format: { type: 'json_object' }
- Wrap JSON.parse in try/catch
- Log raw response for debugging
```

**Problem:** Inconsistent classifications
```
Solution:
- Lower temperature (0.1 or 0)
- Be more explicit in prompt
- Add few-shot examples to system prompt
```

## Time-Saving Tips

### 1. Start Small, Then Expand
```
- Test with 1 query, 1 URL first
- Verify each component works before integrating
- Add more queries only after basic pipeline works
```

### 2. Cache Everything
```typescript
// Save intermediate results
fs.writeFileSync('data/search-results.json', JSON.stringify(urls));
fs.writeFileSync('data/scraped.json', JSON.stringify(scraped));
fs.writeFileSync('data/classified.json', JSON.stringify(classified));

// Skip already-processed URLs
const processed = new Set(existing.map(r => r.url));
const toProcess = urls.filter(u => !processed.has(u));
```

### 3. Use Parallel Processing Wisely
```typescript
// Parallel classification (be careful with rate limits)
const results = await Promise.all(
  sites.slice(0, 5).map(site => classifySite(site.url, site.text))
);

// Sequential with delay (safer)
for (const site of sites) {
  await classifySite(site.url, site.text);
  await sleep(500);
}
```

### 4. Quick Debug Patterns
```typescript
// Log everything during development
console.log(JSON.stringify(result, null, 2));

// Test with known violator first
const TEST_URL = 'https://shipfromusapharmacy.com/';
const result = await scrapeSite(TEST_URL);
console.log('Test scrape:', result);
```

## Quick Wins

### If Search Yields Few Results:
- Broaden queries (remove quotes)
- Try different search terms ("amphetamine" vs "adderall")
- Search for specific formulations ("adderall 30mg", "adderall xr")
- Look for misspellings ("aderall", "aderal")

### If Scraping Fails Frequently:
- Increase timeouts
- Skip problem sites and move on
- Focus on sites that work - you need examples, not completeness

### If Classifications Seem Wrong:
- Review the scraped text - is it capturing the right content?
- Add more specific examples to the prompt
- Check if sites are actually what they seem (redirects, parked domains)

## Checklist Before Final Submission

- [ ] Pipeline runs end-to-end without errors
- [ ] At least some violations detected
- [ ] Evidence is captured and displayed
- [ ] UI is functional and presentable
- [ ] Code is reasonably clean
- [ ] You can explain your methodology

## What Evaluators Likely Care About

1. **Problem-solving approach** - Did you iterate? Did you adapt when things failed?
2. **Technical execution** - Does the code work? Is it reasonable?
3. **Results quality** - Are the findings accurate? Is evidence clear?
4. **UI/Communication** - Can you present findings clearly?
5. **Time management** - Did you scope appropriately?

## Emergency Fallback

If you're running out of time and things aren't working:

1. **Manually find 3-5 violating sites** using regular Google search
2. **Hardcode those URLs** in your pipeline
3. **Focus on making classification + UI work well**
4. **Document what you attempted** and what blocked you

A working demo with fewer sites beats a broken pipeline with ambitious goals.
