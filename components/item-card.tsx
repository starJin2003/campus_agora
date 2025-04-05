"use client"

import { memo, useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"
import type { Item } from "@/lib/types"
import WishlistButton from "@/components/wishlist-button"
import { Edit } from "lucide-react"

interface ItemCardProps {
  item: Item
  isMyItem?: boolean
}

// React.memo로 감싸서 불필요한 리렌더링 방지
const ItemCard = memo(function ItemCard({ item, isMyItem = false }: ItemCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // 컴포넌트가 마운트된 후에만 이미지를 로드
  useEffect(() => {
    setImageLoaded(true)
  }, [])

  return (
    <Card className="overflow-hidden h-full transition-all hover:shadow-md border-primary/20">
      <div className="relative aspect-square">
        <Link href={`/items/${item.id}`}>
          {imageLoaded && (
            <div className="relative w-full h-full">
              <Image
                src={item.image || "/placeholder.svg?height=200&width=200"}
                alt={item.title}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                loading="lazy"
              />
            </div>
          )}
          {!imageLoaded && (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">이미지 로딩 중...</span>
            </div>
          )}
          {item.status === "sold" && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-3 py-1.5">
                판매완료
              </Badge>
            </div>
          )}
          {isMyItem && (
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                <Edit className="h-3 w-3 mr-1" />내 상품
              </Badge>
            </div>
          )}
        </Link>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton itemId={item.id} itemTitle={item.title} />
        </div>
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
})

export default ItemCard

