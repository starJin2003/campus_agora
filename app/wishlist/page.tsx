"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ItemCard from "@/components/item-card"
import { items } from "@/lib/data"
import type { Item } from "@/lib/types"
import MobileNav from "@/components/mobile-nav"
import ProfileButton from "@/components/profile-button"
import { Button } from "@/components/ui/button"

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // 로컬 스토리지에서 관심 상품 목록 가져오기
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")

      // 관심 상품에 해당하는 아이템 필터링
      const filteredItems = items.filter((item) => wishlist.includes(item.id))
      setWishlistItems(filteredItems)
    } catch (error) {
      console.error("Failed to load wishlist:", error)
      setWishlistItems([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Link>
        <h1 className="text-2xl font-bold">관심 상품</h1>
        <ProfileButton />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>로딩 중...</p>
        </div>
      ) : wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">관심 상품이 없습니다</h2>
          <p className="text-muted-foreground mb-6">마음에 드는 상품을 찾아 하트 아이콘을 클릭해보세요</p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">상품 둘러보기</Button>
          </Link>
        </div>
      )}

      <MobileNav />
    </div>
  )
}

