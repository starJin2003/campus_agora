"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MessageCircle, Edit, Check, School } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"
import WishlistButton from "@/components/wishlist-button"
import SellerRating from "@/components/seller-rating"
import MobileNav from "@/components/mobile-nav"
import { useItemStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/storage-utils"
import { useUniversity } from "@/contexts/university-context"

export default function ItemPage({ params, universitySlug }: { params: { id: string }; universitySlug?: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const { items: storeItems, updateItem } = useItemStore()
  const { university } = useUniversity()
  const [item, setItem] = useState<Item | null>(null)
  const [isMyItem, setIsMyItem] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState<string | null>(null)

  // 대학 정보 가져오기
  const [universityName, setUniversityName] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setLoadingError(null)

      try {
        // 로컬 스토리지에서 사용자 정보 가져오기
        if (typeof window !== "undefined") {
          try {
            const userData = JSON.parse(localStorage.getItem("user") || "{}")
            if (userData && userData.id) {
              setUserId(userData.id)
            }
          } catch (error) {
            console.error("Failed to parse user data:", error)
          }
        }

        // 먼저 로컬 스토어에서 아이템 찾기
        const storeItem = storeItems.find((item) => item.id === params.id)

        if (storeItem) {
          console.log("Found item in local store:", storeItem.id, storeItem.title)
          setItem(storeItem)

          if (storeItem.universityName) {
            setUniversityName(storeItem.universityName)
          }

          // 서버에서 최신 정보 가져오기 시도 (백그라운드에서)
          try {
            const response = await fetch(`/api/items/${params.id}`)
            if (response.ok) {
              const serverItem = await response.json()
              // 서버 데이터로 업데이트
              setItem(serverItem)
              updateItem(serverItem)

              if (serverItem.universityName) {
                setUniversityName(serverItem.universityName)
              }
            }
          } catch (serverError) {
            console.error("Failed to fetch item from server:", serverError)
            // 로컬 데이터를 계속 사용하므로 오류 표시하지 않음
          }
        } else {
          // 로컬에 없으면 서버에서 가져오기 시도
          try {
            const response = await fetch(`/api/items/${params.id}`)
            if (response.ok) {
              const serverItem = await response.json()
              setItem(serverItem)

              if (serverItem.universityName) {
                setUniversityName(serverItem.universityName)
              }
            } else {
              throw new Error("Item not found on server")
            }
          } catch (error) {
            console.error("Failed to fetch item:", error)
            setLoadingError("상품을 찾을 수 없습니다.")
          }
        }
      } catch (error) {
        console.error("Error loading item data:", error)
        setLoadingError("상품 정보를 불러오는 중 오류가 발생했습니다.")
      } finally {
        setIsLoading(false)
        // 이미지 로딩 상태 설정
        setImageLoaded(true)
      }
    }

    loadData()
  }, [params.id, storeItems, updateItem])

  // 대학 정보 로드
  useEffect(() => {
    if (item && item.universityName) {
      setUniversityName(item.universityName)
    } else if (universitySlug) {
      // URL에서 대학 슬러그가 제공된 경우
      const fetchUniversityName = async () => {
        try {
          const response = await fetch(`/api/universities/${universitySlug}/details`)
          if (response.ok) {
            const data = await response.json()
            if (data.university && data.university.name) {
              setUniversityName(data.university.name)
            }
          }
        } catch (error) {
          console.error("Failed to fetch university details:", error)
        }
      }

      fetchUniversityName()
    } else {
      // 사용자 정보에서 대학 이름 가져오기
      const userData = getCurrentUser()
      if (userData && userData.university) {
        setUniversityName(userData.university)
      }
    }
  }, [item, universitySlug])

  // 내 판매 상품인지 확인
  useEffect(() => {
    if (item && userId) {
      setIsMyItem(item.seller.id === userId)
    }
  }, [item, userId])

  const handleStatusChange = async (newStatus: "available" | "sold") => {
    if (!item) return

    const updatedItem = { ...item, status: newStatus }

    // 로컬 스토어 업데이트
    updateItem(updatedItem)
    setItem(updatedItem)

    // 서버에도 상태 변경 요청
    try {
      const response = await fetch(`/api/items/${item.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        console.error("Failed to update item status on server")
        toast({
          title: "서버 동기화 실패",
          description: "상태 변경이 로컬에만 적용되었습니다. 다시 시도해주세요.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating item status:", error)
      // 오류 발생 시에도 UI는 이미 업데이트되었으므로 사용자에게 알림만 표시
      toast({
        title: "서버 동기화 실패",
        description: "상태 변경이 로컬에만 적용되었습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }

    toast({
      title: newStatus === "sold" ? "판매 완료로 변경되었습니다" : "판매중으로 변경되었습니다",
      description: `${item.title} 상품의 상태가 변경되었습니다.`,
    })
  }

  const handleMessageSeller = () => {
    if (!userId) {
      toast({
        title: "로그인이 필요합니다",
        description: "메시지를 보내려면 먼저 로그인해주세요.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    if (!item) return

    // 기존 채팅 목록 확인
    try {
      // 모의 채팅 데이터 가져오기 (실제로는 API 호출)
      const mockChats = [
        {
          id: "chat1",
          userId: "user1",
          userName: "김학생",
          userDepartment: "컴퓨터공학과",
          itemId: "1",
          itemTitle: "데이터베이스 개론 교재",
          lastMessage: "안녕하세요, 책 상태가 어떤가요?",
          lastMessageTime: "2023-03-20T14:30:00Z",
          unreadCount: 2,
          type: "selling",
        },
        {
          id: "chat2",
          userId: "user2",
          userName: "이대학",
          userDepartment: "경영학과",
          itemId: "2",
          itemTitle: "아이패드 프로 11인치 (2021)",
          lastMessage: "네, 내일 3시에 도서관 앞에서 만나요.",
          lastMessageTime: "2023-03-21T09:15:00Z",
          unreadCount: 0,
          type: "buying",
        },
        // 다른 채팅 데이터...
      ]

      // 로컬 스토리지에 저장된 채팅 목록 가져오기
      const storedChats = JSON.parse(localStorage.getItem("chats") || "[]")
      const allChats = [...mockChats, ...storedChats]

      // 현재 판매자와의 채팅방 찾기
      const existingChat = allChats.find(
        (chat) =>
          (chat.userId === item.seller.id && chat.type === "buying") ||
          (chat.itemId === item.id && chat.type === "selling"),
      )

      if (existingChat) {
        // 기존 채팅방이 있으면 해당 채팅방으로 이동
        localStorage.setItem("selectedChatId", existingChat.id)
        router.push("/messages")
      } else {
        // 새로운 채팅방 생성
        const newChat = {
          id: `chat${Date.now()}`,
          userId: item.seller.id,
          userName: item.seller.name,
          userDepartment: item.seller.department,
          itemId: item.id,
          itemTitle: item.title,
          lastMessage: "",
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          type: "buying", // 내가 구매자로서 채팅 시작
        }

        // 채팅 목록에 추가
        const updatedChats = [...storedChats, newChat]
        localStorage.setItem("chats", JSON.stringify(updatedChats))
        localStorage.setItem("selectedChatId", newChat.id)

        toast({
          title: "새로운 채팅방이 생성되었습니다",
          description: `${item.seller.name}님과의 채팅이 시작됩니다.`,
        })

        router.push("/messages")
      }
    } catch (error) {
      console.error("Failed to handle message:", error)
      toast({
        title: "오류가 발생했습니다",
        description: "메시지 전송 중 문제가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    }
  }

  // 돌아가기 버튼 핸들러 - 브라우저의 기본 뒤로가기 기능 사용
  const handleGoBack = () => {
    // 브라우저의 기본 뒤로가기 기능 사용
    window.history.back()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <p className="text-lg">로딩 중...</p>
      </div>
    )
  }

  if (loadingError || !item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </button>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">상품을 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-6">
            {loadingError || "요청하신 상품이 존재하지 않거나 삭제되었을 수 있습니다."}
          </p>
          <Button onClick={() => router.push("/")}>홈으로 돌아가기</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        {/* 돌아가기 버튼 수정 - 브라우저의 기본 뒤로가기 기능 사용 */}
        <button onClick={handleGoBack} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </button>
        {universityName && (
          <div className="flex items-center">
            <School className="h-4 w-4 text-primary mr-1" />
            <span className="text-sm font-medium text-primary">{universityName}</span>
          </div>
        )}
        <div className="w-24"></div> {/* 균형을 위한 빈 공간 */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="relative aspect-square rounded-lg overflow-hidden">
          {imageLoaded ? (
            <div className="relative w-full h-full">
              <Image
                src={item.image || "/placeholder.svg?height=500&width=500"}
                alt={item.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">이미지 로딩 중...</span>
            </div>
          )}
          {item.status === "sold" && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-md px-3 py-1.5">
                판매완료
              </Badge>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{item.title}</h1>
              <p className="text-3xl font-bold mt-2">{formatPrice(item.price)}</p>
            </div>
            <div className="flex gap-2">
              {isMyItem ? (
                <Button
                  variant="outline"
                  className={`${
                    item.status === "sold"
                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                      : "bg-green-100 text-green-800 hover:bg-green-200"
                  }`}
                  onClick={() => handleStatusChange(item.status === "available" ? "sold" : "available")}
                >
                  {item.status === "available" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      판매완료로 변경
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      판매중으로 변경
                    </>
                  )}
                </Button>
              ) : (
                <WishlistButton itemId={item.id} itemTitle={item.title} />
              )}
              {item.status === "sold" ? (
                <Badge variant="destructive" className="text-md px-3 py-1.5">
                  판매완료
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-md px-3 py-1.5">
                  판매중
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">카테고리</h2>
              <p>{item.category}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">상태</h2>
              <p>{item.condition}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">거래 장소</h2>
              <p>{item.location}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">등록일</h2>
              <p>{formatDate(item.createdAt)}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h2 className="font-medium mb-2">판매자</h2>
            <div className="flex items-center justify-between">
              <Link href={`/sellers/${item.seller.id}`} className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-3">
                  {item.seller.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{item.seller.name}</p>
                  <p className="text-sm text-muted-foreground">{item.seller.department}</p>
                </div>
              </Link>
              {!isMyItem && <SellerRating sellerId={item.seller.id} sellerName={item.seller.name} />}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="font-medium mb-4">상품 설명</h2>
            <p className="whitespace-pre-line">{item.description}</p>
          </div>

          <div className="mt-8">
            {!isMyItem && item.status !== "sold" && (
              <Button className="w-full" onClick={handleMessageSeller}>
                <MessageCircle className="mr-2 h-4 w-4" />
                판매자에게 메시지 보내기
              </Button>
            )}
            {isMyItem && (
              <Link href={`/items/edit/${item.id}`}>
                <Button variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  상품 정보 수정하기
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

