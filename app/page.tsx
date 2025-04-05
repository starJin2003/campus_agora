"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUniversity } from "@/contexts/university-context"
import { getCurrentUser } from "@/lib/storage-utils"

export default function HomePage() {
  const router = useRouter()
  const { university, isLoading } = useUniversity()

  useEffect(() => {
    if (isLoading) return

    // 사용자 정보 가져오기
    const user = getCurrentUser()

    if (user && user.universitySlug) {
      // 사용자의 대학 페이지로 리다이렉트
      router.push(`/university/${user.universitySlug}`)
    } else if (university && university.slug) {
      // 컨텍스트의 대학 정보로 리다이렉트
      router.push(`/university/${university.slug}`)
    } else {
      // 대학 정보가 없으면 로그인 페이지로 리다이렉트
      router.push("/auth/login")
    }
  }, [university, isLoading, router])

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-lg">리다이렉트 중...</p>
      </div>
    </div>
  )
}

