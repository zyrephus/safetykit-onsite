'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ClassificationResult } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface SiteDetailProps {
  site: ClassificationResult
  open: boolean
  onClose: () => void
}

export function SiteDetail({ site, open, onClose }: SiteDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl">Site Analysis Details</DialogTitle>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline break-all"
          >
            {site.url}
          </a>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Violation Status */}
          <Card className={`${site.is_violation ? 'bg-red-950/50 border-red-500/50' : 'bg-green-950/50 border-green-500/50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {site.is_violation ? (
                  <XCircle className="h-8 w-8 text-red-400" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                )}
                <div>
                  <div className="text-xl font-bold">
                    {site.is_violation ? 'VIOLATION DETECTED' : 'NO VIOLATION'}
                  </div>
                  <div className="text-sm text-slate-400">
                    Confidence: {site.confidence} | Risk Score: {site.risk_score}/100
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Accepts Visa
                  {site.accepts_visa ? (
                    <Badge variant="destructive">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 break-words">
                  {site.visa_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Sells Adderall
                  {site.sells_adderall ? (
                    <Badge variant="destructive">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 break-words">
                  {site.adderall_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Licensed Pharmacy
                  {site.is_licensed_pharmacy ? (
                    <Badge className="bg-green-500">Yes</Badge>
                  ) : (
                    <Badge variant="destructive">No</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400 break-words">
                  {site.license_evidence || 'No evidence found'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analysis */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-sm">Analysis Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{site.reasoning}</p>
            </CardContent>
          </Card>

          {/* Manual Review Flag */}
          {site.needs_manual_review && (
            <Card className="bg-yellow-950/50 border-yellow-500/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-yellow-200 font-semibold">
                    This site requires manual review
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <p className="text-xs text-slate-500">
            Analyzed: {formatDate(site.classifiedAt)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
