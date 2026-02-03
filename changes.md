# Change Log

All changes to the project are logged here.

---

## 2026-02-02

### Add Root .gitignore for Safe Pushes
- **Timestamp:** 2026-02-02T21:05:00
- **File:** `.gitignore`
- **Change:** Added ignore rules for env files, build artifacts, logs, coverage, and pipeline output JSON.
- **Reason:** Prevent secrets and generated files from being pushed to GitHub.

### Increase Scrape/Classify Limit to 20
- **Timestamp:** 2026-02-02T20:45:00
- **Files:** `pipeline/src/scrape.ts`, `pipeline/src/classify.ts`
- **Change:** Updated default scrape/classify limits to 20 and adjusted main routines to use 20.
- **Reason:** Run larger batches per user request.

### Strengthen Classifier Explanations
- **Timestamp:** 2026-02-02T20:40:00
- **File:** `pipeline/src/classify.ts`
- **Change:** Updated prompt to require 2-4 sentence reasoning with explicit page/source references and evidence locations.
- **Reason:** Provide more descriptive explanations and clarify where evidence was found.

### Limit Scrape/Classify to 10 + Elapsed Timer
- **Timestamp:** 2026-02-02T20:35:00
- **Files:** `pipeline/src/scrape.ts`, `pipeline/src/classify.ts`
- **Change:** Set default scrape/classify limits to 10 and added elapsed seconds logging during scraping.
- **Reason:** Reduce batch size and show scrape duration progress.

### Scrape Timeout Guardrails
- **Timestamp:** 2026-02-02T20:20:00
- **File:** `pipeline/src/scrape.ts`
- **Change:** Added explicit timeouts and progress logs for browser connect/navigation/content extraction; switched navigation wait condition to `domcontentloaded`.
- **Reason:** Prevent scraping from appearing stuck on slow pages and fail fast when a site hangs.

### Frontend TypeScript Node Types Fix
- **Timestamp:** 2026-02-02T20:05:00
- **Files:** `frontend/tsconfig.json`, `frontend/package-lock.json`
- **Change:** Added Node/React type declarations and Next.js tsconfig plugin updates; refreshed lockfile after npm install.
- **Reason:** Resolve missing `path`/`process` type errors in `frontend/src/app/page.tsx`.

### Frontend Pipeline Controls
- **Timestamp:** 2026-02-02T19:40:00
- **Files:** `frontend/src/app/api/_pipeline.ts`, `frontend/src/app/api/search/route.ts`, `frontend/src/app/api/scrape/route.ts`, `frontend/src/app/api/classify/route.ts`, `frontend/src/app/api/results/route.ts`, `frontend/src/components/dashboard.tsx`, `frontend/src/components/results-table.tsx`, `frontend/src/components/site-detail.tsx`, `frontend/src/lib/types.ts`
- **Change:** Added server-side API routes to run pipeline steps, normalized results for the UI, and added client-side buttons with loading/error handling.
- **Reason:** Let users trigger search/scrape/classify from the dashboard without exposing secrets.

### Frontend Dashboard (Next.js + shadcn + Tailwind v4)
- **Timestamp:** 2026-02-02T19:10:00
- **Files:** `frontend/components.json`, `frontend/tsconfig.json`, `frontend/next-env.d.ts`, `frontend/package.json`, `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/components/dashboard.tsx`, `frontend/src/components/stats-cards.tsx`, `frontend/src/components/results-table.tsx`, `frontend/src/components/site-detail.tsx`, `frontend/src/components/ui/badge.tsx`, `frontend/src/components/ui/button.tsx`, `frontend/src/components/ui/card.tsx`, `frontend/src/components/ui/dialog.tsx`, `frontend/src/components/ui/select.tsx`, `frontend/src/components/ui/table.tsx`, `frontend/src/components/ui/tabs.tsx`, `frontend/src/components/ui/tooltip.tsx`, `frontend/src/lib/types.ts`, `frontend/src/lib/utils.ts`, `frontend/data/results.json`
- **Change:** Added shadcn/ui configuration and components, app shell, dashboard UI, shared types/utilities, and a results data placeholder for server-side reads.
- **Reason:** Implement the requested Next.js dashboard frontend using the latest stack with Tailwind v4 and shadcn/ui.

### Search Noise Exclusions
- **Timestamp:** 2026-02-02T00:00:00
- **File:** `pipeline/src/search.ts`
- **Change:** Excluded Amazon and academic/research sources via site operators, domain filters, and keyword filters
- **Reason:** Remove marketplace and studies/papers from search results

### Scrape Checkout Evidence
- **Timestamp:** 2026-02-02T00:00:00
- **File:** `pipeline/src/scrape.ts`
- **Change:** Added cart/checkout navigation and DOM-based payment evidence extraction for Visa and other card logos
- **Reason:** Capture payment evidence that appears only in checkout flows

### Phase 5: Implemented UI Dashboard
- **Directory:** `frontend/`
- **Change:** Created Next.js dashboard with shadcn/ui components and Tailwind CSS
- **Implementation Details:**
  - Next.js 16 with App Router and TypeScript
  - Dark mode UI with Tailwind CSS (slate color scheme)
  - Custom shadcn-inspired components (Card, Badge, Table, Button)
  - Dashboard with tabs (Violations / All Sites)
  - Stats cards showing total sites, violations, high-confidence results
  - Results table with filtering by confidence level
  - Detail modal showing evidence for each criterion
  - Reads from `../pipeline/data/classified-results.json`
- **Components Created:**
  - `src/components/dashboard.tsx` - Main container with tabs and filters
  - `src/components/stats-cards.tsx` - Statistics overview
  - `src/components/results-table.tsx` - Data table with actions
  - `src/components/site-detail.tsx` - Evidence detail modal
  - `src/components/ui/*` - Reusable UI components
- **Scripts:**
  - `npm run dev` - Development server (http://localhost:3000)
  - `npm run build` - Production build
  - `npm start` - Start production server
- **Reason:** Phase 5 of pipeline - visualize classified results in professional dashboard UI

### Search Quality Improvements
- **Timestamp:** 2026-02-02T00:00:00
- **File:** `pipeline/src/search.ts`
- **Change:** Expanded queries (Phases 1-4), added negative operators, and introduced multi-layer filtering, scoring, and optional URL validation
- **Reason:** Reduce fundraising/blog/news noise while keeping balanced recall

### Scrape Evidence Extraction
- **Timestamp:** 2026-02-02T00:00:00
- **Files:** `pipeline/src/scrape.ts`, `pipeline/src/types.ts`, `pipeline/src/classify.ts`
- **Change:** Added evidence extraction (payment/product/licensing) and included it in classification prompt
- **Reason:** Provide stronger signals for the three-criteria violation framework

### Pipeline README Updates
- **Timestamp:** 2026-02-02T00:00:00
- **File:** `pipeline/README.md`
- **Change:** Documented search tuning env vars and evidence fields in scraped output
- **Reason:** Keep usage and outputs aligned with updated search/scrape behavior

### Phase 4: Implemented LLM Classification Module
- **File:** `pipeline/src/classify.ts`
- **Change:** Created OpenAI GPT-4o integration to classify scraped sites for violations
- **Implementation Details:**
  - Uses GPT-4o (most capable model) with structured JSON output
  - Applies three-criteria validation framework from methodology
  - Temperature 0.1 for consistent, deterministic results
  - Analyzes up to 8000 chars of content per site
  - Generates confidence scores (high/medium/low) and risk scores (0-100)
  - Skips sites with scraping errors (conservative approach)
- **Test Results:**
  - 5 sites classified: 0 violations detected
  - 1 high-confidence classification (PlushCare - legitimate)
  - 3 need manual review (error pages, insufficient content)
  - Correctly identified informational site vs. sales
- **Classification Logic:**
  - accepts_visa + sells_adderall + NOT licensed = VIOLATION
  - All three must be true to flag as violation
  - Conservative: assumes licensed if cannot verify
- **Output:** Saved to `data/classified-results.json` with evidence for each criterion
- **Reason:** Phase 4 of pipeline - detect violations using AI. Classifications will be displayed in Phase 5 (UI).

### Phase 3: Implemented Web Scraping Module
- **File:** `pipeline/src/scrape.ts`
- **Change:** Created BrightData Scraping Browser integration to extract evidence from search results
- **Implementation Details:**
  - Connects to BrightData via WebSocket (wss://brd.superproxy.io:9222)
  - Uses Puppeteer to control headless browser through proxy
  - Extracts page title, text content, and full HTML
  - Handles errors gracefully (timeouts, failed loads)
  - Rate limiting: 3-second delay between requests
  - Starts with 5 sites as initial test
- **Test Results:**
  - 4/5 successful scrapes (80% success rate)
  - 1 failure (PDF file - expected, not scrapable as webpage)
  - Successfully scraped: fundraising sites (error pages), PlushCare (legitimate info site)
- **Output:** Saved to `data/scraped-results.json` with content, title, URL, timestamp, and error status
- **Reason:** Phase 3 of pipeline - extract evidence for classification. Scraped data will feed into Phase 4 (LLM classification).

### Phase 1 Search Filters
- **File:** `pipeline/src/search.ts`
- **Change:** Added pre-scrape filtering for non-web document URLs (e.g., PDFs)
- **Reason:** Exclude assets that cannot be purchased from or validated for Visa acceptance

### Phase 1 Search Fixes
- **Files:** `pipeline/src/search.ts`, `pipeline/README.md`
- **Change:** Added URL validation, made domain filtering phase-aware, clarified search vs pipeline output files
- **Reason:** Prevent empty URL entries, avoid over-filtering forums in later phases, and align documentation with actual outputs

### Phase 2: Implemented Search Module
- **File:** `pipeline/src/search.ts`
- **Change:** Created SerpAPI integration to find potential violating merchants
- **Implementation Details:**
  - Uses 3 high-intent queries from methodology Phase 1
  - Fetches top 10 Google results per query (30 total)
  - Deduplicates URLs (found 26 unique URLs)
  - Filters out known legitimate domains (CVS, WebMD, etc.)
  - Saves results to `data/search-results.json`
- **Test Results:** Successfully found 25 potential sites to scrape
- **Queries Used:**
  - "buy adderall online no prescription"
  - "order adderall without prescription"
  - "buy adderall online visa"
- **Reason:** This is the first step of the pipeline - discovering potential violators. Search results will feed into Phase 3 (scraping).

### Created .env with API Credentials
- **File:** `pipeline/.env`
- **Change:** Created environment file with actual API keys
- **Keys Configured:**
  - SerpAPI: API key for Google search
  - BrightData: Scraping Browser credentials (using zone-scraping_browser_dev, NOT residential proxy)
  - OpenAI: API key for GPT-4o classification
  - ScrapingDog: Backup scraping service (optional)
- **Reason:** Required for Phase 2 (Search implementation). Using BrightData Scraping Browser (not residential proxy) because it integrates with Puppeteer and handles JavaScript-heavy sites.

### Phase 1: Pipeline Project Initialization
- **Files Created:**
  - `pipeline/package.json` - npm project with scripts
  - `pipeline/tsconfig.json` - TypeScript configuration
  - `pipeline/.env.example` - API key template
  - `pipeline/.gitignore` - Ignore node_modules, .env, data
  - `pipeline/src/types.ts` - Shared TypeScript interfaces
  - `pipeline/README.md` - Pipeline documentation
- **Dependencies Installed:**
  - Runtime: `serpapi`, `puppeteer-core`, `openai`, `dotenv`
  - Dev: `typescript`, `@types/node`, `tsx`
- **Scripts Configured:**
  - `npm run search` - Test search component
  - `npm run scrape` - Test scraping component
  - `npm run classify` - Test classification component
  - `npm run pipeline` - Run full pipeline
- **Reason:** Set up foundation for implementing the search/scrape/classify pipeline. TypeScript types define data structure flow through pipeline.

### Enhanced Search Methodology
- **File:** `docs/01-methodology.md`
- **Change:** Complete rewrite with 4-phase search strategy, detailed classification criteria, pipeline execution strategy, test cases, and success metrics
- **Reason:** User requested comprehensive search methodology before implementation. Added:
  - Phase 1-4 search queries with expected results
  - Three-criteria validation framework (Visa + Adderall + Unlicensed)
  - Confidence scoring and evidence requirements
  - URL filtering and deduplication strategy
  - Known violator test case (shipfromusapharmacy.com)
  - False positive avoidance (CVS, WebMD)
  - Success metrics and implementation checklist

### Created Frontend Documentation
- **Files:** `docs/frontend-nextjs.md`, `docs/frontend-shadcn.md`, `docs/frontend-tailwind.md`
- **Change:** Added comprehensive documentation for Next.js App Router, shadcn/ui components, and Tailwind CSS
- **Reason:** Project now uses Next.js + shadcn + Tailwind instead of vanilla HTML/CSS/JS for a more visually appealing UI

### Updated UI Guide
- **File:** `docs/04-ui-guide.md`
- **Change:** Completely rewrote UI guide with Next.js, shadcn/ui components, and Tailwind CSS
- **Reason:** Replaced vanilla HTML/CSS implementation with modern React component architecture

### Updated Project Overview
- **File:** `docs/00-overview.md`
- **Change:** Updated tech stack and file structure to reflect Next.js frontend
- **Reason:** Project structure changed to separate pipeline and frontend directories

### Updated CLAUDE.md
- **File:** `CLAUDE.md`
- **Change:** Added frontend documentation references, updated project structure and commands
- **Reason:** Reflect new frontend stack (Next.js, shadcn, Tailwind)

### Created API Documentation (earlier)
- **Files:** `docs/api-serpapi.md`, `docs/api-brightdata.md`, `docs/api-openai.md`
- **Change:** Added API reference documentation fetched from Context7
- **Reason:** Provide accurate, up-to-date API documentation for development

### Updated CLAUDE.md (earlier)
- **File:** `CLAUDE.md`
- **Change:** Added requirement to log all changes in `changes.md`
- **Reason:** Track project modifications and maintain audit trail during development

### Created changes.md (earlier)
- **File:** `changes.md`
- **Change:** Created change log file
- **Reason:** Provide centralized tracking of all project modifications

### Fixed Tailwind/PostCSS and ESM config
- **Timestamp:** 2026-02-02 18:23
- **Files:** `frontend/postcss.config.mjs`, `frontend/package.json`
- **Change:** Switched PostCSS Tailwind plugin to `@tailwindcss/postcss` and set package type to `module`
- **Reason:** Resolve Tailwind v4 PostCSS plugin error and ESM/CommonJS mismatch in Next.js

### Added shadcn Tailwind theme tokens
- **Timestamp:** 2026-02-02 00:00
- **File:** `frontend/tailwind.config.ts`
- **Change:** Added CSS variable-based color palette and radius tokens
- **Reason:** Provide `border-border` and related utilities used in `globals.css`

### Set Turbopack root and ESM-safe Tailwind plugin import
- **Timestamp:** 2026-02-02 00:00
- **Files:** `frontend/next.config.mjs`, `frontend/tailwind.config.ts`
- **Change:** Pointed Turbopack root at `frontend` and switched `tailwindcss-animate` to ESM import
- **Reason:** Ensure Tailwind config is discovered from frontend root and avoid CJS `require` in ESM

### Align globals and deps with Tailwind v4
- **Timestamp:** 2026-02-02 18:30
- **Files:** `frontend/src/app/globals.css`, `frontend/package.json`, `frontend/package-lock.json`
- **Change:** Switched to Tailwind v4 `@import` + `@config` in globals and added `clsx`/`tailwind-merge` dependencies
- **Reason:** Load Tailwind config for theme utilities and resolve missing module imports in the frontend build

### Update Tailwind darkMode config for v4 types
- **Timestamp:** 2026-02-02 18:34
- **File:** `frontend/tailwind.config.ts`
- **Change:** Set `darkMode` to `"class"` to match Tailwind v4 type definitions
- **Reason:** Fix TypeScript config validation during `next build`

### Tighten search precision for store-only results
- **Timestamp:** 2026-02-02 18:37
- **File:** `pipeline/src/search.ts`
- **Change:** Tightened queries, expanded noise filtering, and added store-only gating with a strictness flag
- **Reason:** Prioritize transactional store results and reduce informational noise

### Exclude Answers.com from search
- **Timestamp:** 2026-02-02 18:48
- **File:** `pipeline/src/search.ts`
- **Change:** Blocked `answers.com` in search operators and noise filtering
- **Reason:** Avoid wiki/forum content in discovery results

### Skip forum/wiki pages in classification
- **Timestamp:** 2026-02-02 18:50
- **File:** `pipeline/src/classify.ts`
- **Change:** Added forum/wiki detection guard to skip classification on Q&A/wiki pages
- **Reason:** Prevent forum spam content from being misclassified as storefronts

### Increase search/scrape volume to 100 sites
- **Timestamp:** 2026-02-02 18:57
- **Files:** `pipeline/src/search.ts`, `pipeline/src/scrape.ts`
- **Change:** Set default search cap to 100 and scrape limit to 100
- **Reason:** Run search, scrape, and classify on 100 sites instead of 5

## 2026-02-03

### Created Complete Next.js Frontend Dashboard
- **Timestamp:** 2026-02-03T00:45:00
- **Component:** Frontend Dashboard
- **Changes:**
  - Initialized Next.js 16 project with TypeScript, ESLint, and App Router
  - Installed and configured shadcn/ui components (button, card, table, badge, dialog, tabs, select, tooltip)
  - Created type system with ClassificationResult and StatsData interfaces
  - Implemented utility functions (calculateStats, formatDate, getConfidenceBadgeClass)
  - Created dark mode layout with slate color scheme
  - Implemented Server Component data loading from pipeline/data/classified-results.json
  - Built Dashboard component with state management and filtering
  - Created StatsCards component showing 4 metrics (total sites, violations, high confidence, needs review)
  - Built ResultsTable component with URL, status, confidence, risk score columns
  - Implemented SiteDetail modal showing evidence, analysis, and manual review flags
  - Configured Tailwind CSS v3 (downgraded from v4 for shadcn compatibility)
  - Added custom dark mode scrollbar styling
  - Deployed dev server successfully at http://localhost:3000
- **Reason:** User requested frontend to display classified-results.json data cleanly using Next.js, Tailwind, and shadcn


### Updated Confidence Badge Colors
- **Timestamp:** 2026-02-03T00:50:00
- **Component:** Frontend - Confidence Badges
- **Changes:**
  - Updated getConfidenceBadgeClass function to use 400 color variants matching risk score colors
  - High confidence: bg-red-400 (matches risk score >= 80)
  - Medium confidence: bg-yellow-400 (matches risk score >= 50)
  - Low confidence: bg-slate-400 (matches risk score < 50)
  - Added dark text (text-slate-950) for better contrast on bright backgrounds
- **Reason:** User requested confidence badge colors to match risk score color scheme


### Changed Low Risk and Safe Badge Colors to Green
- **Timestamp:** 2026-02-03T00:52:00
- **Component:** Frontend - Badge Colors
- **Changes:**
  - Updated low risk score color from slate to green (text-green-400)
  - Changed Safe badge from secondary variant to green (bg-green-500)
  - Updated low confidence badge from slate to green (bg-green-400)
  - Color scheme now: High/Violation=Red, Medium=Yellow, Low/Safe=Green
- **Reason:** User requested green colors for low risk scores and safe badges


### Added Warning Status Badge and Fixed Text Contrast
- **Timestamp:** 2026-02-03T00:55:00
- **Component:** Frontend - Status Badges
- **Changes:**
  - Added new "Warning" status badge for sites with risk_score > 50 but not violations (yellow)
  - Updated status badge logic: Violation (red) → Warning (yellow, risk > 50) → Safe (green, risk ≤ 50)
  - Updated site detail modal to show three states: VIOLATION DETECTED, WARNING - MODERATE RISK, SAFE - NO VIOLATION
  - Fixed confidence badge text contrast: red/green badges use white text, yellow uses dark text
  - Used 500 color variants instead of 400 for better color saturation
- **Reason:** User requested intermediate status for sites with risk scores above 50, and reported text visibility issues


### Changed Confidence to Plain Text
- **Timestamp:** 2026-02-03T00:57:00
- **Component:** Frontend - Results Table
- **Changes:**
  - Removed Badge component from confidence column
  - Changed to plain colored text with capitalize styling
  - Maintained color scheme: high=red, medium=yellow, low=green
  - Removed unused getConfidenceBadgeClass function import
- **Reason:** User requested confidence to be displayed as text instead of badges

