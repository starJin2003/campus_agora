"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/storage-utils"

interface University {
  id: number
  name: string
  slug: string
  domain?: string
  logoUrl?: string
}

interface UniversityContextType {
  university: University | null
  isLoading: boolean
  error: string | null
  setUniversity: (university: University | null) => void
  currentUniversitySlug: string | null // 현재 URL에서의 대학 슬러그
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined)

export function UniversityProvider({ children }: { children: React.ReactNode }) {
  const [university, setUniversity] = useState<University | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUniversitySlug, setCurrentUniversitySlug] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // URL에서 현재 대학 슬러그 추출
  useEffect(() => {
    if (pathname) {
      const match = pathname.match(/\/university\/([^/]+)/)
      if (match && match[1]) {
        setCurrentUniversitySlug(match[1])
      } else {
        setCurrentUniversitySlug(null)
      }
    }
  }, [pathname])

  useEffect(() => {
    async function loadUniversity() {
      try {
        setIsLoading(true)
        setError(null)

        // 로컬 스토리지에서 사용자 정보 가져오기
        const user = getCurrentUser()

        if (!user) {
          setIsLoading(false)
          return
        }

        // 사용자 대학 정보가 있으면 사용
        if (user.university) {
          // 대학 슬러그 가져오기
          let universitySlug = user.universitySlug

          if (!universitySlug && user.university) {
            // 슬러그가 없으면 API에서 가져오기
            try {
              const response = await fetch(`/api/universities/by-name?name=${encodeURIComponent(user.university)}`)
              if (response.ok) {
                const data = await response.json()
                universitySlug = data.slug

                // 로컬 스토리지 업데이트
                user.universitySlug = universitySlug
                localStorage.setItem("user", JSON.stringify(user))
              }
            } catch (error) {
              console.error("Failed to fetch university slug:", error)
              // 오류 발생 시 기본 슬러그 생성
              universitySlug = user.university.toLowerCase().replace(/\s+/g, "-")
            }
          }

          setUniversity({
            id: user.universityId || 0,
            name: user.university,
            slug: universitySlug || user.university.toLowerCase().replace(/\s+/g, "-"),
          })
        } else if (user.email) {
          // 이메일 도메인으로 대학 정보 가져오기
          try {
            const domain = user.email.split("@")[1]
            const response = await fetch(`/api/universities/by-domain?domain=${domain}`)

            if (response.ok) {
              const universityData = await response.json()

              // 대학 정보 설정
              setUniversity({
                id: universityData.id,
                name: universityData.name,
                slug: universityData.slug,
              })

              // 사용자 정보 업데이트
              user.university = universityData.name
              user.universityId = universityData.id
              user.universitySlug = universityData.slug
              localStorage.setItem("user", JSON.stringify(user))
            }
          } catch (error) {
            console.error("Failed to fetch university by domain:", error)
          }
        }
      } catch (err) {
        console.error("대학 정보 로드 오류:", err)
        setError("대학 정보를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    loadUniversity()
  }, [])

  return (
    <UniversityContext.Provider value={{ university, isLoading, error, setUniversity, currentUniversitySlug }}>
      {children}
    </UniversityContext.Provider>
  )
}

export function useUniversity() {
  const context = useContext(UniversityContext)
  if (context === undefined) {
    throw new Error("useUniversity must be used within a UniversityProvider")
  }
  return context
}

