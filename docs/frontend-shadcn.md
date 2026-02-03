# shadcn/ui Documentation

> Reference documentation for shadcn/ui - beautifully designed, accessible components built with Radix UI and Tailwind CSS.

## Installation (Next.js)

```bash
# Initialize shadcn in your Next.js project
npx shadcn@latest init
```

When prompted:
- Which style would you like to use? **Default**
- Which color would you like to use as base color? **Slate**
- Would you like to use CSS variables? **Yes**

This creates:
- `components.json` - shadcn configuration
- `src/lib/utils.ts` - Utility functions (cn helper)
- `src/components/ui/` - Component directory

## Adding Components

```bash
# Add individual components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add tooltip

# Add multiple at once
npx shadcn@latest add button card table badge dialog
```

## Core Components for This Project

### Button
```tsx
import { Button } from "@/components/ui/button"

// Variants
<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconComponent /></Button>
```

### Card
```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Site Analysis</CardTitle>
    <CardDescription>shipfromusapharmacy.com</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Violation detected with high confidence</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge"

// Variants
<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Violation</Badge>
<Badge variant="outline">Outline</Badge>

// Custom colors with className
<Badge className="bg-green-500">Safe</Badge>
<Badge className="bg-red-500">Violation</Badge>
<Badge className="bg-yellow-500">Review</Badge>
```

### Table
```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>Analyzed sites</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>URL</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Confidence</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {results.map((result) => (
      <TableRow key={result.url}>
        <TableCell>{result.url}</TableCell>
        <TableCell>
          <Badge variant={result.is_violation ? "destructive" : "secondary"}>
            {result.is_violation ? "Violation" : "Safe"}
          </Badge>
        </TableCell>
        <TableCell>{result.confidence}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Dialog
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">View Evidence</Button>
  </DialogTrigger>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Site Analysis Details</DialogTitle>
      <DialogDescription>
        Evidence collected from {url}
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Evidence content */}
    </div>
    <DialogFooter>
      <DialogClose asChild>
        <Button variant="outline">Close</Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Tabs
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="violations" className="w-full">
  <TabsList>
    <TabsTrigger value="violations">Violations</TabsTrigger>
    <TabsTrigger value="all">All Sites</TabsTrigger>
    <TabsTrigger value="stats">Statistics</TabsTrigger>
  </TabsList>
  <TabsContent value="violations">
    {/* Violations table */}
  </TabsContent>
  <TabsContent value="all">
    {/* All sites table */}
  </TabsContent>
  <TabsContent value="stats">
    {/* Stats dashboard */}
  </TabsContent>
</Tabs>
```

### Select
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select onValueChange={(value) => setFilter(value)}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Filter by confidence" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All</SelectItem>
    <SelectItem value="high">High Confidence</SelectItem>
    <SelectItem value="medium">Medium Confidence</SelectItem>
    <SelectItem value="low">Low Confidence</SelectItem>
  </SelectContent>
</Select>
```

## Data Table (Advanced)

For sortable, filterable tables, use the DataTable pattern:

```bash
npx shadcn@latest add table
npm install @tanstack/react-table
```

```tsx
// columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export type SiteResult = {
  url: string
  title: string
  is_violation: boolean
  confidence: "high" | "medium" | "low"
}

export const columns: ColumnDef<SiteResult>[] = [
  {
    accessorKey: "url",
    header: "URL",
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "is_violation",
    header: "Status",
    cell: ({ row }) => {
      const isViolation = row.getValue("is_violation") as boolean
      return (
        <Badge variant={isViolation ? "destructive" : "secondary"}>
          {isViolation ? "Violation" : "Safe"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "confidence",
    header: "Confidence",
    cell: ({ row }) => {
      const confidence = row.getValue("confidence") as string
      const colors = {
        high: "bg-red-500",
        medium: "bg-yellow-500",
        low: "bg-gray-500",
      }
      return (
        <Badge className={colors[confidence]}>
          {confidence}
        </Badge>
      )
    },
  },
]
```

## The cn() Utility

The `cn()` function merges Tailwind classes intelligently:

```tsx
import { cn } from "@/lib/utils"

// Conditional classes
<div className={cn(
  "rounded-lg p-4",
  isViolation && "border-red-500 bg-red-50",
  !isViolation && "border-green-500 bg-green-50"
)}>
  Content
</div>
```

## Best Practices

1. **Use composition** - Combine simple components to build complex UIs
2. **Customize via className** - Override styles with Tailwind classes
3. **Keep components in ui/** - Don't modify installed components directly
4. **Create wrappers** - For custom behavior, wrap shadcn components
5. **Use variants** - Leverage built-in variants before custom styling
