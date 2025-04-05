"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SellerRatingProps {
  sellerId: string
  sellerName: string
}

export default function SellerRating({ sellerId, sellerName }: SellerRatingProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "별점을 선택해주세요",
        description: "판매자 평가를 위해 별점을 선택해주세요.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // 평가 제출 시뮬레이션
    setTimeout(() => {
      // 로컬 스토리지에 평가 저장
      const ratings = JSON.parse(localStorage.getItem("sellerRatings") || "{}")
      ratings[sellerId] = {
        rating,
        review,
        date: new Date().toISOString(),
      }
      localStorage.setItem("sellerRatings", JSON.stringify(ratings))

      setIsSubmitting(false)
      setIsOpen(false)

      toast({
        title: "평가가 제출되었습니다",
        description: `${sellerName}님에 대한 평가가 성공적으로 제출되었습니다.`,
      })

      // 폼 초기화
      setRating(0)
      setReview("")
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          판매자 평가하기
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>판매자 평가</DialogTitle>
          <DialogDescription>
            {sellerName}님과의 거래 경험을 평가해주세요. 다른 사용자들에게 도움이 됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="text-center mb-4">
            <p className="font-medium">
              {rating === 1 && "불만족"}
              {rating === 2 && "아쉬움"}
              {rating === 3 && "보통"}
              {rating === 4 && "만족"}
              {rating === 5 && "매우 만족"}
              {rating === 0 && "별점을 선택해주세요"}
            </p>
          </div>

          <Textarea
            placeholder="거래 경험에 대한 후기를 남겨주세요 (선택사항)"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "제출 중..." : "평가 제출하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

