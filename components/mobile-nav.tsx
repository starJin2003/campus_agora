"use client"

import type React from "react"

import { memo, useMemo } from "react"
import { usePathname } from "next/navigation"
import { Search, Heart, MessageCircle, User, Home, School } from "lucide-react"
import { useUniversity } from "@/contexts/university-context"
import { useUniversityNavigation } from "@/lib/navigation-utils"

interface MobileNavProps {
  universityName?: string | null
  universityOfficialName?: string | null // 공식 명칭 추가
}

const MobileNav = memo(function MobileNav({ universityName, universityOfficialName }: MobileNavProps) {
  const pathname = usePathname()
  const { currentUniversitySlug } = useUniversity()
  const { navigateTo } = useUniversityNavigation()

  // 대학 컨텍스트를 고려한 경로 생성
  const getUniversityPath = (path: string) => {
    if (!currentUniversitySlug) return path

    // 이미 /university/ 경로를 포함하는 경우 그대로 반환
    if (path.startsWith("/university/")) return path

    // 루트 경로인 경우 대학 메인 페이지로 이동
    if (path === "/") return `/university/${currentUniversitySlug}`

    // 그 외 경로는 대학 컨텍스트를 유지
    return `/university/${currentUniversitySlug}${path}`
  }

  // 현재 경로가 대학 컨텍스트 내에 있는지 확인
  const isActive = (path: string) => {
    if (path === "/" && pathname.startsWith(`/university/${currentUniversitySlug}`)) {
      return true
    }

    if (path !== "/" && pathname.includes(path)) {
      return true
    }

    return pathname === path
  }

  // 네비게이션 항목 메모이제이션
  const navItems = useMemo(
    () => [
      {
        href: getUniversityPath("/"),
        icon: <Home className="h-6 w-6" />,
        label: "홈",
        active: isActive("/"),
      },
      {
        href: getUniversityPath("/items"),
        icon: <Search className="h-6 w-6" />,
        label: "검색",
        active: isActive("/items"),
      },
      {
        href: getUniversityPath("/wishlist"),
        icon: <Heart className="h-6 w-6" />,
        label: "관심상품",
        active: isActive("/wishlist"),
      },
      {
        href: getUniversityPath("/messages"),
        icon: <MessageCircle className="h-6 w-6" />,
        label: "메시지",
        active: isActive("/messages"),
      },
      {
        href: getUniversityPath("/profile"),
        icon: <User className="h-6 w-6" />,
        label: "내정보",
        active: isActive("/profile"),
      },
    ],
    [pathname, currentUniversitySlug],
  )

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    navigateTo(href)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/20 py-2 px-4 md:hidden z-50 shadow-lg">
      {universityName && (
        <div className="flex items-center justify-center mb-1 bg-primary/5 py-1 px-2 rounded-full">
          <School className="h-3 w-3 text-primary mr-1" />
          <span className="text-xs text-primary font-medium">
            {universityOfficialName || universityName} 마켓플레이스
          </span>
        </div>
      )}
      <div className="flex justify-around">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => handleNavClick(e, item.href)}
            className={`flex flex-col items-center ${item.active ? "text-primary" : "text-muted-foreground"}`}
            aria-label={item.label}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  )
})

export default MobileNav

