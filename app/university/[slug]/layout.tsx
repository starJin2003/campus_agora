import type { ReactNode } from "react"
import { Suspense } from "react"

interface UniversityLayoutProps {
  children: ReactNode
  params: {
    slug: string
  }
}

export default function UniversityLayout({ children, params }: UniversityLayoutProps) {
  return <Suspense fallback={<div>Loading university context...</div>}>{children}</Suspense>
}

