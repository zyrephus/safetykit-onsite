'use client'

import { useState } from 'react'
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
import type { ClassificationResult } from '@/lib/types'
import { getConfidenceBadgeClass } from '@/lib/utils'

interface ResultsTableProps {
  results: ClassificationResult[]
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [selectedSite, setSelectedSite] = useState<ClassificationResult | null>(null)

  return (
    <>
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-900 hover:bg-slate-900">
              <TableHead className="text-slate-300">Site URL</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
              <TableHead className="text-slate-300">Confidence</TableHead>
              <TableHead className="text-slate-300">Risk Score</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              results.map((result, idx) => (
                <TableRow key={idx} className="border-slate-800 hover:bg-slate-900/50">
                  <TableCell>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline truncate block max-w-md"
                    >
                      {result.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.is_violation ? 'destructive' : 'secondary'}>
                      {result.is_violation ? 'Violation' : 'Safe'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getConfidenceBadgeClass(result.confidence)}>
                      {result.confidence}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${result.risk_score >= 80 ? 'text-red-400' : result.risk_score >= 50 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {result.risk_score}
                    </span>
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
