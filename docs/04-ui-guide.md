# UI Implementation Guide (Next.js + shadcn + Tailwind)

## Goal
Create a visually appealing, modern dashboard using Next.js App Router, shadcn/ui components, and Tailwind CSS.

## Quick Setup

```bash
# Create Next.js app with Tailwind
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

cd frontend

# Initialize shadcn
npx shadcn@latest init

# Add required components
npx shadcn@latest add button card table badge dialog tabs select tooltip
```

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home/Dashboard page
│   │   ├── globals.css        # Global styles
│   │   └── api/
│   │       └── results/
│   │           └── route.ts   # API endpoint
│   ├── components/
│   │   ├── ui/                # shadcn components (auto-generated)
│   │   ├── dashboard.tsx      # Main dashboard
│   │   ├── stats-cards.tsx    # Stats overview
│   │   ├── results-table.tsx  # Results data table
│   │   └── site-detail.tsx    # Detail dialog
│   └── lib/
│       └── utils.ts           # cn() helper
├── data/
│   └── results.json           # Pipeline output
└── package.json
```

## Root Layout

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SafetyKit - Visa Violation Report',
  description: 'Detection dashboard for payment network violations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

## Dashboard Page

```tsx
// src/app/page.tsx
import { Dashboard } from '@/components/dashboard'

async function getResults() {
  // In production, fetch from your API
  const fs = await import('fs')
  const path = await import('path')

  try {
    const filePath = path.join(process.cwd(), 'data', 'results.json')
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

export default async function Home() {
  const results = await getResults()

  return (
    <main className="container mx-auto py-8 px-4">
      <Dashboard results={results} />
    </main>
  )
}
```

## Dashboard Component

```tsx
// src/components/dashboard.tsx
'use client'

import { useState } from 'react'
import { StatsCards } from './stats-cards'
import { ResultsTable } from './results-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Result {
  url: string
  title: string
  classification: {
    is_violation: boolean
    confidence: 'high' | 'medium' | 'low'
    accepts_visa: boolean
    visa_evidence: string
    sells_adderall: boolean
    adderall_evidence: string
    is_licensed_pharmacy: boolean
    license_evidence: string
    reasoning: string
  }
  screenshot?: string
  scrapedAt: string
}

export function Dashboard({ results }: { results: Result[] }) {
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')

  const violations = results.filter(r => r.classification?.is_violation)
  const highConfidence = violations.filter(r => r.classification?.confidence === 'high')

  const filteredResults = results.filter(r => {
    if (confidenceFilter === 'all') return true
    return r.classification?.confidence === confidenceFilter
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Visa Violation Report
        </h1>
        <p className="text-slate-400">
          Merchants facilitating illegal Adderall sales
        </p>
      </div>

      {/* Stats */}
      <StatsCards
        total={results.length}
        violations={violations.length}
        highConfidence={highConfidence.length}
      />

      {/* Filters */}
      <div className="flex justify-end">
        <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter confidence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="high">High Only</SelectItem>
            <SelectItem value="medium">Medium Only</SelectItem>
            <SelectItem value="low">Low Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Tabs */}
      <Tabs defaultValue="violations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="violations">
            Violations ({violations.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Sites ({results.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="violations" className="mt-6">
          <ResultsTable results={filteredResults.filter(r => r.classification?.is_violation)} />
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <ResultsTable results={filteredResults} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Stats Cards Component

```tsx
// src/components/stats-cards.tsx
import { Card, CardContent } from '@/components/ui/card'

interface StatsCardsProps {
  total: number
  violations: number
  highConfidence: number
}

export function StatsCards({ total, violations, highConfidence }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">{total}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              Sites Analyzed
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-red-500/50 border-2">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{violations}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              Violations Found
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-400">{highConfidence}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              High Confidence
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Results Table Component

```tsx
// src/components/results-table.tsx
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SiteDetail } from './site-detail'
import { useState } from 'react'

interface Result {
  url: string
  title: string
  classification: {
    is_violation: boolean
    confidence: 'high' | 'medium' | 'low'
    reasoning: string
    accepts_visa: boolean
    visa_evidence: string
    sells_adderall: boolean
    adderall_evidence: string
    is_licensed_pharmacy: boolean
    license_evidence: string
  }
  screenshot?: string
  scrapedAt: string
}

export function ResultsTable({ results }: { results: Result[] }) {
  const [selectedSite, setSelectedSite] = useState<Result | null>(null)

  const confidenceColors = {
    high: 'bg-red-500 hover:bg-red-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600 text-black',
    low: 'bg-slate-500 hover:bg-slate-600',
  }

  return (
    <>
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900 hover:bg-slate-900">
              <TableHead className="text-slate-300">Site</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Confidence</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results.map((result, idx) => (
                <TableRow key={idx} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell>
                    <div>
                      <div className="font-medium truncate max-w-xs">
                        {result.title || 'Unknown'}
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:underline truncate block max-w-xs"
                      >
                        {result.url}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.classification?.is_violation ? 'destructive' : 'secondary'}>
                      {result.classification?.is_violation ? 'Violation' : 'Safe'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={confidenceColors[result.classification?.confidence || 'low']}>
                      {result.classification?.confidence || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSite(result)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedSite && (
        <SiteDetail
          site={selectedSite}
          open={!!selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </>
  )
}
```

## Site Detail Dialog

```tsx
// src/components/site-detail.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SiteDetailProps {
  site: {
    url: string
    title: string
    classification: {
      is_violation: boolean
      confidence: string
      accepts_visa: boolean
      visa_evidence: string
      sells_adderall: boolean
      adderall_evidence: string
      is_licensed_pharmacy: boolean
      license_evidence: string
      reasoning: string
    }
    screenshot?: string
    scrapedAt: string
  }
  open: boolean
  onClose: () => void
}

export function SiteDetail({ site, open, onClose }: SiteDetailProps) {
  const { classification } = site

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl">{site.title || 'Site Analysis'}</DialogTitle>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline"
          >
            {site.url}
          </a>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Accepts Visa
                  {classification.accepts_visa ? (
                    <Badge variant="destructive">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">
                  {classification.visa_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Sells Adderall
                  {classification.sells_adderall ? (
                    <Badge variant="destructive">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">
                  {classification.adderall_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Licensed Pharmacy
                  {classification.is_licensed_pharmacy ? (
                    <Badge className="bg-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="destructive">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">
                  {classification.license_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm">Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{classification.reasoning}</p>
            </CardContent>
          </Card>

          {/* Screenshot */}
          {site.screenshot && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm">Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={`data:image/png;base64,${site.screenshot}`}
                  alt="Site screenshot"
                  className="rounded-lg w-full"
                />
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <p className="text-xs text-slate-500">
            Analyzed: {new Date(site.scrapedAt).toLocaleString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## Global Styles Enhancement

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... shadcn default variables ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... shadcn dark variables ... */
  }
}

/* Custom scrollbar for dark mode */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgb(30 41 59); /* slate-800 */
}

::-webkit-scrollbar-thumb {
  background: rgb(71 85 105); /* slate-600 */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(100 116 139); /* slate-500 */
}
```

## Running the UI

```bash
cd frontend

# Development
npm run dev
# Opens at http://localhost:3000

# Production build
npm run build
npm start
```
