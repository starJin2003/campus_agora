"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Star } from "lucide-react"
import ItemCard from "@/components/item-card"
import { items } from "@/lib/data"
import { formatDate } from "@/lib/utils"

interface Rating {
  rating: number
  review: string
  date: string
}

interface Seller {
  id: string
  name: string
  department: string
  joinDate: string
}

export default function SellerProfilePage({ params }: { params: { id: string } }) {
  const [sellerRatings, setSellerRatings] = useState<Rating[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [seller, setSeller] = useState<Seller>({
    id: params.id,
    name: "판매자",
    department: "학과정보 없음",
    joinDate: "2022-09-01T00:00:00Z",
  })

  // 판매자의 상품 목록
  const sellerItems = items.filter((item) => item.seller.id === params.id)

  // 판매자 평가 불러오기
  useEffect(() => {
    const loadSellerData = async () => {
      try {
        // 서버에서 판매자 정보 가져오기
        const response = await fetch(`/api/users/${params.id}`)

        if (response.ok) {
          const sellerData = await response.json()

          // 판매자 정보 설정
          setSeller({
            id: params.id,
            name: sellerData.name,
            department: sellerData.department || "학과정보 없음",
            joinDate: sellerData.createdAt || "2022-09-01T00:00:00Z", // 기본값 유지
          })
        } else {
          // API 호출 실패 시 기존 로직 사용
          setSeller({
            id: params.id,
            name:
              params.id === "user1"
                ? "김학생"
                : params.id === "user2"
                  ? "이대학"
                  : params.id === "user3"
                    ? "박기숙"
                    : "판매자",
            department:
              params.id === "user1"
                ? "컴퓨터공학과"
                : params.id === "user2"
                  ? "경영학과"
                  : params.id === "user3"
                    ? "건축학과"
                    : "학과정보 없음",
            joinDate: "2022-09-01T00:00:00Z",
          })
        }
      } catch (error) {
        console.error("판매자 정보 로드 오류:", error)
        // 오류 발생 시 기존 로직 사용
        setSeller({
          id: params.id,
          name:
            params.id === "user1"
              ? "김학생"
              : params.id === "user2"
                ? "이대학"
                : params.id === "user3"
                  ? "박기숙"
                  : "판매자",
          department:
            params.id === "user1"
              ? "컴퓨터공학과"
              : params.id === "user2"
                ? "경영학과"
                : params.id === "user3"
                  ? "건축학과"
                  : "학과정보 없음",
          joinDate: "2022-09-01T00:00:00Z",
        })
      }
    }

    loadSellerData()

    // 로컬 스토리지에서 평가 데이터 가져오기
    const ratings = JSON.parse(localStorage.getItem("sellerRatings") || "{}")
    const sellerRating = ratings[params.id]

    // 실제 구현에서는 API 호출로 대체
    const mockRatings: Rating[] = [
      {
        rating: 5,
        review: "친절하고 시간 약속을 잘 지켜요. 물품 상태도 설명과 동일했습니다.",
        date: "2023-02-15T14:30:00Z",
      },
      {
        rating: 4,
        review: "좋은 거래였습니다. 다음에도 거래하고 싶어요.",
        date: "2023-01-20T10:15:00Z",
      },
    ]

    // 로컬 스토리지에 저장된 평가가 있으면 추가
    if (sellerRating) {
      mockRatings.unshift(sellerRating)
    }

    setSellerRatings(mockRatings)

    // 평균 평점 계산
    const sum = mockRatings.reduce((acc, curr) => acc + curr.rating, 0)
    setAverageRating(sum / mockRatings.length)
  }, [params.id])

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-muted p-6 rounded-lg">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                {seller.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold">{seller.name}</h1>
              <p className="text-muted-foreground">{seller.department}</p>
              <div className="flex items-center mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm">
                  {averageRating.toFixed(1)} ({sellerRatings.length}개 평가)
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">가입일</h2>
                <p>{new Date(seller.joinDate).toLocaleDateString()}</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">판매 상품</h2>
                <p>{sellerItems.length}개</p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">판매 완료</h2>
                <p>{sellerItems.filter((item) => item.status === "sold").length}개</p>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full">메시지 보내기</Button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">판매 상품</h2>
            {sellerItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {sellerItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">판매 중인 상품이 없습니다.</p>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">판매자 평가</h2>
            {sellerRatings.length > 0 ? (
              <div className="space-y-4">
                {sellerRatings.map((rating, index) => (
                  <div key={index} className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">{formatDate(rating.date)}</span>
                    </div>
                    <p>{rating.review || "평가 내용이 없습니다."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">아직 평가가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

