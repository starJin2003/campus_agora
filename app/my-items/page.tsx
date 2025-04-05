"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useItemStore } from "@/lib/store"
import type { Item } from "@/lib/types"
import MobileNav from "@/components/mobile-nav"
import ProfileButton from "@/components/profile-button"
import { useToast } from "@/hooks/use-toast"
import { useUniversityNavigation } from "@/lib/navigation-utils"

export default function MyItemsPage({ universitySlug }: { universitySlug?: string }) {
  const { navigateTo } = useUniversityNavigation()
  const { getMyItems } = useItemStore()
  const [myItems, setMyItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      if (userData && userData.id) {
        setUserId(userData.id)
        setMyItems(getMyItems(userData.id))
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getMyItems])

  // 브라우저 뒤로가기 사용 - 메인 페이지로 이동하도록 수정
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      // 브라우저의 기본 뒤로가기 기능 사용
      window.history.back()
    }
  }

  // 내 판매 상품용 커스텀 아이템 카드
  const MyItemCard = ({ item }: { item: Item }) => {
    return (
      <Card className="overflow-hidden h-full transition-all hover:shadow-md border-primary/20">
        <div className="relative aspect-square">
          <Link href={`/items/${item.id}`}>
            <Image
              src={item.image || "/placeholder.svg?height=200&width=200"}
              alt={item.title}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {item.status === "sold" ? (
                <Badge variant="destructive" className="text-lg px-3 py-1.5">
                  판매완료
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-lg px-3 py-1.5 bg-white/80">
                  판매중
                </Badge>
              )}
            </div>
          </Link>
        </div>
        <Link href={`/items/${item.id}`}>
          <CardContent className="p-4">
            <h3 className="font-medium line-clamp-1">{item.title}</h3>
            <p className="text-lg font-bold mt-1 text-foreground">{formatPrice(item.price)}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between text-sm text-muted-foreground">
            <span>{item.location}</span>
            <span>{formatDate(item.createdAt)}</span>
          </CardFooter>
        </Link>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={handleGoBack} className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold">내 판매 상품</h1>
        <ProfileButton />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>로딩 중...</p>
        </div>
      ) : myItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {myItems.map((item) => (
            <MyItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">등록한 상품이 없습니다</h2>
          <p className="text-muted-foreground mb-6">판매하고 싶은 물품을 등록해보세요</p>
          <Link href="/create-item">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              물품 등록하기
            </Button>
          </Link>
        </div>
      )}

      {/* 물품 등록 플로팅 버튼 */}
      <Link href="/create-item">
        <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 z-50 flex items-center justify-center text-white cursor-pointer">
          <Plus className="h-6 w-6" />
        </div>
      </Link>

      <MobileNav />
    </div>
  )
}

