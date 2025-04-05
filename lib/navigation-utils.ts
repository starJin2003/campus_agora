"use client"

import { useUniversity } from "@/contexts/university-context"
import { useRouter } from "next/navigation"

// 대학 컨텍스트를 유지하면서 페이지 이동
export function useUniversityNavigation() {
  const { university, currentUniversitySlug } = useUniversity()
  const router = useRouter()

  // 대학 컨텍스트를 유지하면서 페이지 이동
  const navigateTo = (path: string) => {
    // 이미 /university/ 경로를 포함하는 경우 그대로 이동
    if (path.startsWith("/university/")) {
      router.push(path)
      return
    }

    // 루트 경로인 경우 대학 메인 페이지로 이동
    if (path === "/") {
      // 현재 URL에서 대학 슬러그가 있으면 해당 대학 페이지로 이동
      if (currentUniversitySlug) {
        router.push(`/university/${currentUniversitySlug}`)
        return
      }

      // 사용자의 대학 정보가 있으면 해당 대학 페이지로 이동
      if (university && university.slug) {
        router.push(`/university/${university.slug}`)
        return
      }

      // 둘 다 없으면 일반 홈으로 이동
      router.push("/")
      return
    }

    // 그 외 경로는 현재 대학 컨텍스트를 유지하면서 이동
    if (currentUniversitySlug) {
      // 현재 URL의 대학 컨텍스트 유지
      router.push(`/university/${currentUniversitySlug}${path}`)
    } else if (university && university.slug) {
      // 사용자 대학 컨텍스트 사용
      router.push(`/university/${university.slug}${path}`)
    } else {
      // 대학 컨텍스트가 없으면 일반 경로로 이동
      router.push(path)
    }
  }

  // 뒤로가기 함수 (대학 컨텍스트 유지)
  const goBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  // 대학 메인 페이지로 이동
  const goToUniversityHome = () => {
    if (currentUniversitySlug) {
      router.push(`/university/${currentUniversitySlug}`)
    } else if (university && university.slug) {
      router.push(`/university/${university.slug}`)
    } else {
      router.push("/")
    }
  }

  return {
    navigateTo,
    goBack,
    goToUniversityHome,
    currentUniversitySlug: currentUniversitySlug || university?.slug || null,
  }
}

