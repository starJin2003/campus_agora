"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import ProfilePage from "@/app/profile/page"
import { useUniversity } from "@/contexts/university-context"

export default function UniversityProfilePage({ params }: { params: { slug: string } }) {
  const { university, currentUniversitySlug } = useUniversity()
  const router = useRouter()

  // 대학 컨텍스트 확인
  useEffect(() => {
    // 사용자의 대학과 URL의 대학이 다른 경우 경고 또는 리다이렉트 처리 가능
    if (university && university.slug && university.slug !== params.slug) {
      console.warn("다른 대학 페이지에 접근 중입니다.")
    }
  }, [university, params.slug])

  return <ProfilePage universitySlug={params.slug} />
}

