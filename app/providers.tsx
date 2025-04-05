"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { useEffect, useState, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import ErrorBoundary from "@/components/error-boundary"
import { UniversityProvider } from "@/contexts/university-context"
import { useItemStore } from "@/lib/store"
import { getCurrentUser, setToStorage } from "@/lib/storage-utils"

// 인증이 필요하지 않은 경로 목록
const publicPaths = [
  "/auth/login",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password", // 비밀번호 재설정 페이지
]

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const isMounted = useRef(true)
  const { syncWithServer } = useItemStore() // 추가
  const [syncInterval, setSyncInterval] = useState<NodeJS.Timeout | null>(null)

  // 컴포넌트 언마운트 시 isMounted 플래그 설정
  useEffect(() => {
    setIsClient(true)

    return () => {
      isMounted.current = false
      // 인터벌 정리
      if (syncInterval) {
        clearInterval(syncInterval)
      }
    }
  }, [syncInterval])

  // 서버와 주기적으로 동기화
  useEffect(() => {
    const setupSync = async () => {
      try {
        // 로그인 상태 확인
        const user = getCurrentUser()

        if (user && user.id) {
          // 초기 동기화 실행
          await syncWithServer()

          // 30초마다 동기화 (실제 서비스에서는 더 긴 간격으로 설정 가능)
          const interval = setInterval(async () => {
            await syncWithServer()
          }, 30000)

          setSyncInterval(interval)

          // 사용자 프로필 정보 동기화
          try {
            const profileResponse = await fetch("/api/sync/profile")
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()

              // 서버에서 받은 최신 사용자 정보로 업데이트
              if (profileData.user) {
                const updatedUser = {
                  ...user,
                  ...profileData.user,
                  isLoggedIn: true,
                }
                setToStorage("user", updatedUser)
              }
            }
          } catch (error) {
            console.error("프로필 동기화 오류:", error)
          }
        }
      } catch (error) {
        console.error("동기화 설정 오류:", error)
      }
    }

    if (isClient && !publicPaths.includes(pathname)) {
      setupSync()
    }
  }, [isClient, pathname, syncWithServer])

  useEffect(() => {
    try {
      // 로그인 상태 확인
      const user = localStorage.getItem("user")

      // 디버깅 로그 추가
      console.log("현재 경로:", pathname)
      console.log("공개 경로 여부:", publicPaths.includes(pathname))
      console.log("사용자 로그인 상태:", !!user)

      // 안전하게 상태 업데이트 및 라우팅
      if (isMounted.current) {
        // 로그인이 필요한 페이지에 접근했는데 로그인이 안 되어 있으면 로그인 페이지로 리다이렉트
        if (!user && !publicPaths.includes(pathname) && !pathname.startsWith("/auth/reset-password")) {
          console.log("로그인 필요, 로그인 페이지로 리다이렉트")
          router.push("/auth/login")
        }

        // 이미 로그인된 상태에서 로그인 페이지에 접근하면 메인 페이지로 리다이렉트
        if (user && publicPaths.includes(pathname)) {
          console.log("이미 로그인됨, 메인 페이지로 리다이렉트")
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Failed to check login status:", error)
    } finally {
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [pathname, router])

  if (!isClient || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  // 개발 환경에서 특정 오류 메시지 억제
  return (
    <ErrorBoundary suppressConsole={process.env.NODE_ENV === "development"}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <UniversityProvider>{children}</UniversityProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

