import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ClassificationResult, StatsData } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateStats(results: ClassificationResult[]): StatsData {
  const violations = results.filter(r => r.is_violation)
  const highConfidence = violations.filter(r => r.confidence === 'high')
  const needsReview = results.filter(r => r.needs_manual_review)

  return {
    total: results.length,
    violations: violations.length,
    highConfidence: highConfidence.length,
    needsReview: needsReview.length,
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getConfidenceBadgeClass(confidence: string): string {
  const colors = {
    high: 'bg-red-400 hover:bg-red-500 text-slate-950',
    medium: 'bg-yellow-400 hover:bg-yellow-500 text-slate-950',
    low: 'bg-slate-400 hover:bg-slate-500 text-slate-950'
  }
  return colors[confidence as keyof typeof colors] || colors.low
}
