"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, User, School } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MobileNav from "@/components/mobile-nav"
import { getCurrentUser, setToStorage } from "@/lib/storage-utils"
import { getUniversityFromEmail } from "@/lib/auth-utils"
import { useUniversityNavigation } from "@/lib/navigation-utils"
import { useRouter } from "next/navigation"

interface UserData {
  id: string
  name: string
  email: string
  department?: string
  isVerified: boolean
  profileImage?: string
  university?: string
  universitySlug?: string
}

interface ProfilePageProps {
  universitySlug?: string
}

export default function ProfilePage({ universitySlug }: ProfilePageProps) {
  const { toast } = useToast()
  const { navigateTo } = useUniversityNavigation()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    profileImage: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMounted = useRef(true)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 컴포넌트 언마운트 시 isMounted 플래그 설정
  useEffect(() => {
    setIsClient(true)
    return () => {
      isMounted.current = false
    }
  }, [])

  // 서버에서 최신 프로필 정보 가져오기
  const fetchProfileFromServer = async () => {
    try {
      const response = await fetch("/api/sync/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        if (data.user) {
          // 로컬 스토리지에서 기존 사용자 정보 가져오기
          const localUser = getCurrentUser()

          // 서버 데이터와 로컬 데이터 병합
          const mergedUser = {
            ...localUser,
            ...data.user,
            isLoggedIn: true,
          }

          // 상태 업데이트
          setUserData(mergedUser)
          setFormData({
            name: mergedUser.name || "",
            department: mergedUser.department || "",
            profileImage: mergedUser.profileImage || "",
          })

          // 로컬 스토리지 업데이트
          setToStorage("user", mergedUser)

          return true
        }
      }
      return false
    } catch (error) {
      console.error("프로필 정보 가져오기 오류:", error)
      return false
    }
  }

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true)

        // 먼저 서버에서 최신 정보 가져오기 시도
        const serverDataLoaded = await fetchProfileFromServer()

        if (!serverDataLoaded) {
          // 서버에서 가져오기 실패 시 로컬 스토리지 사용
          const user = getCurrentUser()

          if (!user || !user.id) {
            console.error("사용자 정보를 찾을 수 없습니다.")
            setError("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.")
            return
          }

          // 대학 정보가 없으면 이메일에서 추출
          if (!user.university && user.email) {
            user.university = getUniversityFromEmail(user.email)
            setToStorage("user", user)
          }

          if (isMounted.current) {
            setUserData(user)
            setFormData({
              name: user.name || "",
              department: user.department || "",
              profileImage: user.profileImage || "",
            })
          }
        }
      } catch (error) {
        console.error("프로필 데이터 로드 오류:", error)
        setError("프로필 정보를 불러오는 중 오류가 발생했습니다.")
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    loadUserData()
  }, [])

  // 프로필 사진 업로드 핸들러 추가
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64String = reader.result as string
          setFormData((prev) => ({
            ...prev,
            profileImage: base64String,
          }))
        }
        reader.onerror = () => {
          console.error("이미지 파일 읽기 오류")
          toast({
            title: "이미지 업로드 실패",
            description: "이미지 파일을 읽는 중 오류가 발생했습니다.",
            variant: "destructive",
          })
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error("프로필 이미지 변경 오류:", error)
      toast({
        title: "이미지 업로드 실패",
        description: "이미지 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 서버와 동기화하는 handleSubmit 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData) {
      toast({
        title: "오류",
        description: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("프로필 업데이트 시작:", formData)

      // 로컬 스토리지에 먼저 저장 (즉시 UI 반영)
      const updatedUser = {
        ...userData,
        name: formData.name,
        department: formData.department || "",
        profileImage: formData.profileImage,
      }

      // 로컬 스토리지에 저장
      setToStorage("user", updatedUser)

      // 상태 업데이트
      setUserData(updatedUser)

      // 서버에 프로필 업데이트 요청
      const response = await fetch("/api/sync/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          profileImage: formData.profileImage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("서버 응답 오류:", errorData)
        // 서버 업데이트 실패해도 로컬 변경은 유지
        toast({
          title: "서버 동기화 실패",
          description: "프로필이 로컬에만 업데이트되었습니다. 나중에 다시 시도해주세요.",
          variant: "warning",
        })
      } else {
        const data = await response.json()
        console.log("서버 응답 성공:", data)

        // 성공 메시지 표시
        toast({
          title: "프로필 업데이트 완료",
          description: "프로필 정보가 성공적으로 업데이트되었습니다.",
        })
      }

      // 편집 모드 종료
      setIsEditing(false)
    } catch (error) {
      console.error("프로필 업데이트 오류:", error)
      toast({
        title: "프로필 업데이트 부분 성공",
        description: "로컬에는 저장되었지만 서버 동기화에 실패했습니다.",
        variant: "warning",
      })
      // 오류가 발생해도 편집 모드 종료
      setIsEditing(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 로그아웃 함수
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청
      await fetch("/api/auth/logout", {
        method: "POST",
      }).catch((error) => {
        console.error("로그아웃 API 호출 오류:", error)
      })

      // 로컬 스토리지에서 사용자 정보 백업
      const userData = getCurrentUser()

      // 토큰 제거
      localStorage.removeItem("token")

      // 쿠키에서도 토큰 제거 시도
      if (typeof document !== "undefined") {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      }

      // 사용자 정보는 유지하되 로그인 상태만 변경
      if (userData) {
        userData.isLoggedIn = false
        localStorage.setItem("user", JSON.stringify(userData))
      }

      toast({
        title: "로그아웃 성공",
        description: "성공적으로 로그아웃되었습니다.",
      })

      // 직접 window.location을 사용하여 로그인 페이지로 이동
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("로그아웃 오류:", error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  // 돌아가기 버튼 핸들러 - 메인 페이지로 이동
  const handleGoBack = () => {
    // 메인 페이지로 이동
    if (universitySlug) {
      navigateTo(`/university/${universitySlug}`)
    } else if (userData?.universitySlug) {
      navigateTo(`/university/${userData.universitySlug}`)
    } else {
      navigateTo("/")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center text-red-500">오류 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error}</p>
            <div className="flex justify-center">
              <Button onClick={() => navigateTo("/auth/login")}>로그인 페이지로 이동</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-center">사용자 정보 없음</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.</p>
            <div className="flex justify-center">
              <Button onClick={() => navigateTo("/auth/login")}>로그인 페이지로 이동</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleGoBack} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold">내 프로필</h1>
        <div className="w-24"></div> {/* 균형을 위한 빈 공간 */}
      </div>

      <div className="max-w-md mx-auto">
        <Card>
          {/* 프로필 카드 헤더 부분 수정 */}
          <CardHeader className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden">
                {isClient && formData.profileImage ? (
                  <img
                    src={formData.profileImage || "/placeholder.svg"}
                    alt="프로필 사진"
                    className="w-full h-full object-cover"
                    onError={() => setFormData((prev) => ({ ...prev, profileImage: "" }))}
                  />
                ) : userData?.name ? (
                  userData.name.charAt(0).toUpperCase()
                ) : (
                  <User className="h-12 w-12" />
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <label htmlFor="profile-image" className="cursor-pointer">
                    <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </div>
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                </div>
              )}
            </div>
            <CardTitle>{userData?.name || "사용자"}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-1">
              <School className="h-4 w-4" />
              {userData?.university || "대학교"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">학과 (선택사항)</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="학과를 입력하세요 (선택사항)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" value={userData?.email || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="university">대학교</Label>
                  <Input id="university" value={userData?.university || ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">대학교 정보는 이메일 도메인에서 자동으로 추출됩니다</p>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                    취소
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        저장 중...
                      </span>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        저장
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">이름</h3>
                    <p>{userData?.name || "-"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">학과</h3>
                    <p>{userData?.department || "-"}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">이메일</h3>
                  <p>{userData?.email || "-"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">대학교</h3>
                  <p>{userData?.university || "-"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">계정 상태</h3>
                  <p>인증됨</p>
                </div>

                <div className="pt-4">
                  <Button onClick={() => setIsEditing(true)} className="w-full">
                    프로필 수정
                  </Button>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t p-4">
            <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              로그아웃
            </Button>
          </CardFooter>
        </Card>
      </div>

      <MobileNav universityName={userData?.university} />
    </div>
  )
}

