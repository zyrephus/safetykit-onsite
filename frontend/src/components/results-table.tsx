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
                    {result.is_violation ? (
                      <Badge variant="destructive">Violation</Badge>
                    ) : result.risk_score > 50 ? (
                      <Badge className="bg-yellow-500 text-slate-950 border-yellow-500 hover:bg-yellow-600">
                        Warning
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 text-white border-green-500 hover:bg-green-600">
                        Safe
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium capitalize ${
                      result.confidence === 'high' ? 'text-red-400' :
                      result.confidence === 'medium' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {result.confidence}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`font-semibold ${result.risk_score >= 80 ? 'text-red-400' : result.risk_score >= 50 ? 'text-yellow-400' : 'text-green-400'}`}>
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
