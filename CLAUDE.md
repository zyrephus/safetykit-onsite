# CLAUDE.md

This file provides guidance to Claude Code when working on this project.

## Project Overview

SafetyKit Onsite - A pipeline to detect merchants abusing Visa's payment network to facilitate illegal drug sales.

## Documentation Reference

**Always refer to the `docs/` folder for up-to-date information:**

### API Documentation
| Document | Purpose |
|----------|---------|
| `docs/api-serpapi.md` | SerpApi JavaScript SDK - Google search API |
| `docs/api-brightdata.md` | BrightData Scraping Browser - Puppeteer proxy scraping |
| `docs/api-openai.md` | OpenAI Node.js SDK - Chat completions & structured output |

### Frontend Documentation
| Document | Purpose |
|----------|---------|
| `docs/frontend-nextjs.md` | Next.js App Router - pages, layouts, data fetching |
| `docs/frontend-shadcn.md` | shadcn/ui components - Button, Card, Table, Dialog |
| `docs/frontend-tailwind.md` | Tailwind CSS - utilities, dark mode, responsive design |
| `docs/04-ui-guide.md` | Complete UI implementation with components |

### Project Documentation
| Document | Purpose |
|----------|---------|
| `docs/00-overview.md` | Project overview, time budget, success metrics |
| `docs/01-methodology.md` | Search strategies, classification approach |
| `docs/02-technical-setup.md` | Project initialization, dependencies |
| `docs/03-implementation-guide.md` | Full code examples for each component |
| `docs/05-tips-and-pitfalls.md` | Troubleshooting, common issues |
| `docs/06-cheatsheet.md` | Quick reference for copy-paste |

## Key APIs

### SerpApi (Search)
- Endpoint: `https://serpapi.com/search`
- SDK: `serpapi` npm package
- See: `docs/api-serpapi.md`

### BrightData (Scraping)
- Endpoint: `wss://{USER}:{PASS}@brd.superproxy.io:9222`
- Use: `puppeteer-core` to connect
- See: `docs/api-brightdata.md`

### OpenAI (Classification)
- Use model: `gpt-4o` or `gpt-4o-2024-08-06` for structured output
- SDK: `openai` npm package
- See: `docs/api-openai.md`

## Frontend Stack

### Next.js
- App Router with Server Components
- See: `docs/frontend-nextjs.md`

### shadcn/ui
- Install: `npx shadcn@latest add [component]`
- Components: Button, Card, Table, Badge, Dialog, Tabs, Select
- See: `docs/frontend-shadcn.md`

### Tailwind CSS
- Utility-first CSS framework
- Dark mode with `dark:` prefix
- See: `docs/frontend-tailwind.md`

## Violation Criteria

A merchant should be flagged if ALL THREE are true:
1. **Accepts Visa** as a payment method
2. **Sells Adderall** (a controlled substance)
3. **Not a licensed pharmacy**

## Project Structure

```
pipeline/                    # Backend data pipeline
  src/
    search.ts               # SerpApi integration
    scrape.ts               # BrightData scraping
    classify.ts             # OpenAI classification
    pipeline.ts             # Main orchestration
  data/
    results.json            # Output data

frontend/                    # Next.js dashboard
  src/
    app/
      layout.tsx            # Root layout
      page.tsx              # Dashboard page
      globals.css           # Global styles
    components/
      ui/                   # shadcn components
      dashboard.tsx         # Main dashboard
      stats-cards.tsx       # Stats overview
      results-table.tsx     # Results table
      site-detail.tsx       # Detail dialog
    lib/
      utils.ts              # cn() helper

docs/
  *.md                      # Documentation (READ THESE)
```

## Commands

### Pipeline (Backend)
```bash
cd pipeline
npm run search     # Test search alone
npm run scrape     # Test scraping alone
npm run classify   # Test classification alone
npm run pipeline   # Full pipeline
```

### Frontend (Next.js)
```bash
cd frontend
npm run dev        # Development server (http://localhost:3000)
npm run build      # Production build
npm start          # Start production server
```

## Important Notes

1. **Always use proxies** for web scraping (BrightData Scraping Browser)
2. **Check docs/** before implementing any API integration
3. **Use gpt-4o** for classification (most capable model)
4. **Cache intermediate results** to save time during iteration
5. **Log all changes** - After every code change, file creation, or modification, append an entry to `changes.md` with:
   - Timestamp
   - What changed (file/component)
   - Brief description of the change
   - Reason for the change
