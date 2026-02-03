# SerpApi Documentation

> Reference documentation for SerpApi JavaScript SDK - programmatic Google search access.

## Installation

```bash
npm install serpapi
```

## Configuration

### Global Configuration
```javascript
import { config, getJson } from "serpapi";

// Set global API key and timeout
config.api_key = "YOUR_API_KEY";
config.timeout = 60000; // 60 seconds

// Now all requests use this API key
await getJson({ engine: "google", q: "coffee" });

// Override per-request if needed
await getJson({ engine: "google", api_key: "DIFFERENT_KEY", q: "tea" });
```

## Core Method: `getJson()`

```javascript
getJson(parameters: object, callback?: fn)
```

**Parameters:**
- `engine` - Search engine (e.g., "google", "bing", "yahoo")
- `api_key` - Your SerpApi API key
- `q` - Search query
- `location` - Geographic location (optional)
- `num` - Number of results (optional, default 10)
- `gl` - Country code (optional, e.g., "us")
- `hl` - Language code (optional, e.g., "en")

## Usage Examples

### ES Modules (Recommended)
```javascript
import { getJson } from "serpapi";

const response = await getJson({
  engine: "google",
  api_key: process.env.SERPAPI_KEY,
  q: "buy adderall online visa",
  location: "United States",
  num: "20",
  gl: "us",
  hl: "en"
});

console.log(response.organic_results);
```

### CommonJS
```javascript
const { getJson } = require("serpapi");

getJson({
  engine: "google",
  api_key: process.env.SERPAPI_KEY,
  q: "coffee",
  location: "Austin, Texas"
}, (json) => {
  console.log(json["organic_results"]);
});
```

### Using Fetch (No SDK)
```javascript
async function searchGoogle(query) {
  const params = new URLSearchParams({
    q: query,
    api_key: process.env.SERPAPI_KEY,
    engine: 'google',
    num: '20',
    gl: 'us',
    hl: 'en'
  });

  const response = await fetch(`https://serpapi.com/search?${params}`);
  const data = await response.json();
  return data.organic_results || [];
}
```

## Response Structure

```javascript
{
  "search_metadata": {
    "id": "...",
    "status": "Success",
    "json_endpoint": "...",
    "created_at": "...",
    "processed_at": "...",
    "google_url": "...",
    "raw_html_file": "...",
    "total_time_taken": 1.23
  },
  "search_parameters": {
    "engine": "google",
    "q": "query",
    "location_requested": "...",
    "location_used": "..."
  },
  "search_information": {
    "organic_results_state": "Results for exact spelling",
    "query_displayed": "query",
    "total_results": 1234567890,
    "time_taken_displayed": 0.45
  },
  "organic_results": [
    {
      "position": 1,
      "title": "Page Title",
      "link": "https://example.com",
      "displayed_link": "https://example.com",
      "snippet": "Description of the page...",
      "snippet_highlighted_words": ["highlighted", "words"],
      "cached_page_link": "...",
      "related_pages_link": "..."
    }
  ]
}
```

## Key Fields in `organic_results`

| Field | Description |
|-------|-------------|
| `position` | Result ranking (1-indexed) |
| `title` | Page title |
| `link` | URL to the page |
| `snippet` | Text excerpt from the page |
| `displayed_link` | Cleaned URL for display |

## Rate Limits & Best Practices

1. **Add delays between requests** - 1-2 seconds recommended
2. **Check your quota** - Monitor usage at serpapi.com/manage-api-key
3. **Cache results** - Avoid re-fetching the same queries
4. **Handle errors gracefully** - Wrap in try/catch

```javascript
async function safeSearch(query) {
  try {
    const results = await getJson({
      engine: "google",
      api_key: process.env.SERPAPI_KEY,
      q: query
    });
    return results.organic_results || [];
  } catch (error) {
    console.error(`Search failed for "${query}":`, error.message);
    return [];
  }
}
```

## Get Your API Key

1. Sign up at https://serpapi.com
2. Get your API key from https://serpapi.com/manage-api-key
3. Store in environment variable: `SERPAPI_KEY`
