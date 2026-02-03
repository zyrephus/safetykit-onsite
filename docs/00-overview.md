# SafetyKit Onsite: Project Overview

## Objective
Build a pipeline to identify merchants abusing Visa's payment network to facilitate illegal Adderall sales.

## Time Budget (3.5 hours)

| Phase | Time | Description |
|-------|------|-------------|
| 1. Setup & Scaffolding | 20 min | Project init, dependencies, env vars |
| 2. Search Discovery | 40 min | SerpApi integration, query strategies |
| 3. Web Scraping | 45 min | BrightData Scraping Browser setup |
| 4. LLM Classification | 40 min | OpenAI integration for violation detection |
| 5. UI Development | 50 min | HTML report with findings |
| 6. Iteration & Polish | 25 min | Bug fixes, edge cases, improvements |
| **Buffer** | 10 min | Unexpected issues |

## Violation Criteria (All Must Be True)
1. **Accepts Visa** - Evidence of Visa payment acceptance
2. **Sells Adderall** - Clearly offers Adderall for sale
3. **Not Licensed** - Not a legitimate licensed pharmacy

## Example Violator
- https://shipfromusapharmacy.com/

## Tech Stack
- **Node.js/TypeScript** - Runtime
- **SerpApi** - Programmatic Google search
- **BrightData** - Scraping Browser with proxies
- **OpenAI** - LLM classification (use most powerful model)
- **Next.js** - React framework with App Router
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first styling

## Key Files to Create
```
safetykit-onsite/
├── pipeline/                    # Backend pipeline
│   ├── src/
│   │   ├── search.ts           # SerpApi search logic
│   │   ├── scrape.ts           # BrightData scraping
│   │   ├── classify.ts         # OpenAI classification
│   │   └── pipeline.ts         # Orchestration
│   ├── data/
│   │   └── results.json        # Scraped & classified data
│   ├── package.json
│   └── .env                    # API keys (DO NOT COMMIT)
├── frontend/                    # Next.js dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Dashboard page
│   │   │   └── globals.css     # Global styles
│   │   ├── components/
│   │   │   ├── ui/             # shadcn components
│   │   │   ├── dashboard.tsx
│   │   │   ├── stats-cards.tsx
│   │   │   └── results-table.tsx
│   │   └── lib/
│   │       └── utils.ts        # cn() helper
│   ├── data/
│   │   └── results.json        # Symlink or copy from pipeline
│   └── package.json
└── docs/                        # Documentation
```

## Success Metrics
- [ ] Pipeline discovers potential violating merchants
- [ ] Each merchant is scraped via proxy
- [ ] LLM classifies each with reasoning
- [ ] UI displays findings with evidence
- [ ] At least a few confirmed violators identified
