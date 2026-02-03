# Next.js Documentation

> Reference documentation for Next.js App Router - React framework for full-stack web applications.

## Installation

```bash
npx create-next-app@latest safetykit-frontend --typescript --tailwind --eslint --app --src-dir
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like your code inside a `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to use Turbopack? **Yes**
- Would you like to customize the import alias? **No** (keep `@/*`)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout (wraps all pages)
│   ├── page.tsx          # Home page (/)
│   ├── globals.css       # Global styles + Tailwind
│   ├── api/
│   │   └── results/
│   │       └── route.ts  # API route (/api/results)
│   └── dashboard/
│       └── page.tsx      # Dashboard page (/dashboard)
├── components/
│   ├── ui/               # shadcn components
│   └── ...               # Custom components
└── lib/
    └── utils.ts          # Utility functions
```

## App Router Basics

### Pages
Files named `page.tsx` in the `app/` directory become routes:

```typescript
// src/app/page.tsx → Route: /
export default function HomePage() {
  return <h1>Home</h1>
}

// src/app/dashboard/page.tsx → Route: /dashboard
export default function DashboardPage() {
  return <h1>Dashboard</h1>
}
```

### Layouts
Layouts wrap pages and persist across navigations:

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafetyKit Report',
  description: 'Visa violation detection dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

## Server Components (Default)

Pages are Server Components by default - they run on the server:

```typescript
// src/app/dashboard/page.tsx
// This is a Server Component - can fetch data directly

async function getResults() {
  const res = await fetch('http://localhost:3001/api/results', {
    cache: 'no-store' // Always fetch fresh data
  })
  return res.json()
}

export default async function DashboardPage() {
  const results = await getResults()

  return (
    <div className="container mx-auto py-10">
      <h1>Violation Report</h1>
      <p>Found {results.length} sites analyzed</p>
      {/* Render results */}
    </div>
  )
}
```

## Client Components

Use `'use client'` directive for interactive components:

```typescript
// src/components/results-filter.tsx
'use client'

import { useState } from 'react'

export function ResultsFilter({ onFilter }: { onFilter: (filter: string) => void }) {
  const [filter, setFilter] = useState('all')

  return (
    <select
      value={filter}
      onChange={(e) => {
        setFilter(e.target.value)
        onFilter(e.target.value)
      }}
    >
      <option value="all">All Results</option>
      <option value="violations">Violations Only</option>
      <option value="high">High Confidence</option>
    </select>
  )
}
```

## Data Fetching Patterns

### Static Data (Cached)
```typescript
// Default behavior - cached until redeployed
const data = await fetch('https://api.example.com/data')
```

### Dynamic Data (No Cache)
```typescript
// Fresh data on every request
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store'
})
```

### Revalidated Data
```typescript
// Revalidate every 60 seconds
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }
})
```

## API Routes

Create API endpoints in `app/api/`:

```typescript
// src/app/api/results/route.ts
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'results.json')
    const data = fs.readFileSync(filePath, 'utf-8')
    return NextResponse.json(JSON.parse(data))
  } catch (error) {
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  // Process the data
  return NextResponse.json({ success: true })
}
```

## Environment Variables

```bash
# .env.local (gitignored)
SERPAPI_KEY=...
BRIGHTDATA_AUTH=...
OPENAI_API_KEY=...

# Public variables (exposed to browser)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Access in code:
```typescript
// Server-side only
const apiKey = process.env.SERPAPI_KEY

// Client-side (must have NEXT_PUBLIC_ prefix)
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

## Running the App

```bash
# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Best Practices

1. **Server Components by default** - Only use `'use client'` when needed
2. **Colocate data fetching** - Fetch data in Server Components, pass to Client Components
3. **Use loading.tsx** - Create loading states for pages
4. **Use error.tsx** - Create error boundaries for pages
5. **Organize by feature** - Group related components, not by type
