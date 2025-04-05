"use client"

import type React from "react"

import { useState, useEffect, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WishlistButtonProps {
  itemId: string
  itemTitle: string
}

// React.memo로 감싸서 불필요한 리렌더링 방지
const WishlistButton = memo(function WishlistButton({ itemId, itemTitle }: WishlistButtonProps) {
  const { toast } = useToast()
  const [isWishlisted, setIsWishlisted] = useState(false)

  // 로컬 스토리지에서 관심 상품 목록 확인
  useEffect(() => {
    try {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")
      setIsWishlisted(wishlist.includes(itemId))
    } catch (error) {
      console.error("Failed to parse wishlist:", error)
      setIsWishlisted(false)
    }
  }, [itemId])

  const toggleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      try {
        // 로컬 스토리지에서 관심 상품 목록 가져오기
        const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]")

        if (isWishlisted) {
          // 관심 상품에서 제거
          const updatedWishlist = wishlist.filter((id: string) => id !== itemId)
          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
          setIsWishlisted(false)

          toast({
            title: "관심 상품에서 제거되었습니다",
            description: `${itemTitle}이(가) 관심 상품에서 제거되었습니다.`,
          })
        } else {
          // 관심 상품에 추가
          const updatedWishlist = [...wishlist, itemId]
          localStorage.setItem("wishlist", JSON.stringify(updatedWishlist))
          setIsWishlisted(true)

          toast({
            title: "관심 상품에 추가되었습니다",
            description: `${itemTitle}이(가) 관심 상품에 추가되었습니다.`,
          })
        }
      } catch (error) {
        console.error("Failed to update wishlist:", error)
        toast({
          title: "오류가 발생했습니다",
          description: "관심 상품 업데이트 중 문제가 발생했습니다.",
          variant: "destructive",
        })
      }
    },
    [isWishlisted, itemId, itemTitle, toast],
  )

  return (
    <Button
      variant="outline"
      size="icon"
      className={`bg-white/80 border-primary/20 hover:bg-white ${isWishlisted ? "text-accent" : "text-muted-foreground"}`}
      onClick={toggleWishlist}
      aria-label={isWishlisted ? "관심 상품에서 제거" : "관심 상품에 추가"}
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "fill-accent text-accent" : ""}`} />
    </Button>
  )
})

export default WishlistButton

