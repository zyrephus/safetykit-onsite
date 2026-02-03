import { Card, CardContent } from '@/components/ui/card'
import type { StatsData } from '@/lib/types'

interface StatsCardsProps {
  stats: StatsData
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              Sites Analyzed
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-red-500/50 border-2">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-red-400">{stats.violations}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              Violations Found
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-400">{stats.highConfidence}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              High Confidence
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-400">{stats.needsReview}</div>
            <div className="text-sm text-slate-400 uppercase tracking-wide mt-1">
              Need Review
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
