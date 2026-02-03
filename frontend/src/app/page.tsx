import fs from 'fs'
import path from 'path'
import { Dashboard } from '@/components/dashboard'
import type { ClassificationResult } from '@/lib/types'

async function getResults(): Promise<ClassificationResult[]> {
  try {
    const filePath = path.join(process.cwd(), '..', 'pipeline', 'data', 'classified-results.json')
    const data = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading results:', error)
    return []
  }
}

export default async function HomePage() {
  const results = await getResults()

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      <Dashboard results={results} />
    </main>
  )
}
