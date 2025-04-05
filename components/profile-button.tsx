"use client"

import type React from "react"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, MessageCircle, Package, School } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser, removeFromStorage } from "@/lib/storage-utils"
import { useUniversityNavigation } from "@/lib/navigation-utils"

const ProfileButton = memo(function ProfileButton() {
  const { navigateTo } = useUniversityNavigation()
  const { toast } = useToast()
  const [userName, setUserName] = useState("")
  const [profileImage, setProfileImage] = useState("")
  const [university, setUniversity] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const userData = getCurrentUser()
    if (userData) {
      if (userData.name) {
        setUserName(userData.name)
      }
      if (userData.profileImage) {
        setProfileImage(userData.profileImage)
      }
      if (userData.university) {
        setUniversity(userData.university)
      }
    }
  }, [])

  const handleLogout = useCallback(() => {
    removeFromStorage("user")
    toast({
      title: "로그아웃 성공",
      description: "안전하게 로그아웃되었습니다.",
    })
    navigateTo("/auth/login")
  }, [navigateTo, toast])

  const handleImageError = useCallback(() => {
    setProfileImage("")
  }, [])

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigateTo(path)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border border-primary/20 overflow-hidden p-0"
          aria-label="프로필 메뉴"
        >
          {isClient && profileImage ? (
            <div className="relative w-full h-full">
              <img
                src={profileImage || "/placeholder.svg"}
                alt="프로필"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary">
              {userName ? userName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
            {isClient && profileImage ? (
              <img
                src={profileImage || "/placeholder.svg"}
                alt="프로필"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : userName ? (
              userName.charAt(0).toUpperCase()
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium">{userName || "사용자"}</p>
            {university ? (
              <p className="text-xs text-muted-foreground flex items-center">
                <School className="h-3 w-3 mr-1" />
                {university}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">학생</p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => handleNavigation(e, "/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>프로필</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleNavigation(e, "/my-items")}>
          <Package className="mr-2 h-4 w-4" />
          <span>내 판매 상품</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleNavigation(e, "/messages")}>
          <MessageCircle className="mr-2 h-4 w-4" />
          <span>내 채팅</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => handleNavigation(e, "/wishlist")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-4 w-4"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>관심 상품</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export default ProfileButton

