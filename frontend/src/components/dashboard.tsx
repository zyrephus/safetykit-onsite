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
import type { ClassificationResult } from '@/lib/types'
import { calculateStats } from '@/lib/utils'

interface DashboardProps {
  results: ClassificationResult[]
}

export function Dashboard({ results }: DashboardProps) {
  const [confidenceFilter, setConfidenceFilter] = useState<string>('all')

  const stats = calculateStats(results)
  const violations = results.filter(r => r.is_violation)

  const filteredResults = results.filter(r => {
    if (confidenceFilter === 'all') return true
    return r.confidence === confidenceFilter
  })

  const filteredViolations = violations.filter(r => {
    if (confidenceFilter === 'all') return true
    return r.confidence === confidenceFilter
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
      <StatsCards stats={stats} />

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
            Violations ({filteredViolations.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Sites ({filteredResults.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="violations" className="mt-6">
          <ResultsTable results={filteredViolations} />
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <ResultsTable results={filteredResults} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
