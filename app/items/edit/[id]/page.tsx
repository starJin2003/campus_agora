"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useItemStore } from "@/lib/store"
import { items as initialItems } from "@/lib/data"
import type { Item } from "@/lib/types"
import { notFound } from "next/navigation"
import { useUniversity } from "@/contexts/university-context"

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { items: storeItems, updateItem } = useItemStore()
  const { university } = useUniversity()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [item, setItem] = useState<Item | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    category: "",
    condition: "",
    location: "",
    description: "",
    image: "",
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user && user.id) {
        setUserData(user)
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
    }

    // 상품 정보 가져오기
    const storeItem = storeItems.find((item) => item.id === params.id)
    const dataItem = initialItems.find((item) => item.id === params.id)

    const foundItem = storeItem || dataItem

    if (foundItem) {
      setItem(foundItem)
      setFormData({
        title: foundItem.title,
        price: foundItem.price.toString(),
        category: foundItem.category,
        condition: foundItem.condition,
        location: foundItem.location,
        description: foundItem.description,
        image: foundItem.image || "",
      })
      setImagePreview(foundItem.image || null)
    } else {
      notFound()
    }
  }, [params.id, storeItems])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setImagePreview(base64String)
        setFormData((prev) => ({ ...prev, image: base64String }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData || !item) {
      toast({
        title: "오류가 발생했습니다",
        description: "사용자 정보나 상품 정보를 불러올 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    // 필수 필드 검증
    const requiredFields = ["title", "price", "category", "condition", "location", "description"]
    const emptyFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (emptyFields.length > 0) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "모든 필수 항목을 입력해야 물품을 수정할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // 상품 정보 업데이트
    const updatedItem: Item = {
      ...item,
      title: formData.title,
      price: Number.parseInt(formData.price),
      description: formData.description,
      image: formData.image || item.image,
      category: formData.category,
      condition: formData.condition,
      location: formData.location,
    }

    // 상품 업데이트
    updateItem(updatedItem)

    // 성공 메시지 표시
    toast({
      title: "상품 정보 수정 완료",
      description: "상품 정보가 성공적으로 수정되었습니다.",
    })

    // 상품 상세 페이지로 이동 - 히스토리 스택 관리 개선
    setTimeout(() => {
      setIsSubmitting(false)

      // 히스토리 스택에서 현재 페이지와 이전 페이지를 제거하고 새 페이지로 대체
      if (typeof window !== "undefined") {
        // 현재 URL을 저장
        const currentUrl = window.location.href

        // 먼저 한 단계 뒤로 이동 (이전 페이지로)
        window.history.back()

        // 약간의 지연 후 새 URL로 대체 (이렇게 하면 히스토리 스택이 깔끔하게 정리됨)
        setTimeout(() => {
          window.location.replace(`/items/${item.id}`)
        }, 10)
      } else {
        // 서버 사이드에서는 일반적인 방법으로 리다이렉트
        router.replace(`/items/${item.id}`)
      }
    }, 1000)
  }

  // 돌아가기 버튼 핸들러 - 브라우저의 기본 뒤로가기 기능 사용
  const handleGoBack = () => {
    // 브라우저의 기본 뒤로가기 기능 사용
    window.history.back()
  }

  if (!item) {
    return <div className="container mx-auto px-4 py-8">로딩 중...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* 돌아가기 버튼 수정 - 브라우저의 기본 뒤로가기 기능 사용 */}
      <button
        onClick={handleGoBack}
        className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </button>

      <h1 className="text-2xl font-bold mb-6">상품 정보 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="판매할 물품의 제목을 입력하세요"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              type="number"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="교재/책">교재/책</SelectItem>
                <SelectItem value="전자기기">전자기기</SelectItem>
                <SelectItem value="가구/인테리어">가구/인테리어</SelectItem>
                <SelectItem value="의류/패션">의류/패션</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="condition">상태</Label>
            <Select value={formData.condition} onValueChange={(value) => handleSelectChange("condition", value)}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="새 상품">새 상품</SelectItem>
                <SelectItem value="거의 새 상품">거의 새 상품</SelectItem>
                <SelectItem value="상태 좋음">상태 좋음</SelectItem>
                <SelectItem value="사용감 있음">사용감 있음</SelectItem>
                <SelectItem value="상태 나쁨">상태 나쁨</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">거래 장소</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="거래 희망 장소를 입력하세요"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">상품 설명</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="판매할 물품에 대한 상세 설명을 입력하세요"
            rows={5}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>상품 이미지</Label>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {imagePreview ? (
              <div className="mb-4">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="상품 이미지 미리보기"
                  className="max-h-48 mx-auto object-contain"
                />
              </div>
            ) : (
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            )}
            <p className="text-sm text-muted-foreground mb-1">이미지를 드래그하거나 클릭하여 업로드하세요</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (최대 5MB)</p>
            <input id="image" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById("image")?.click()}
            >
              {imagePreview ? "이미지 변경" : "이미지 선택"}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            "수정 중..."
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              상품 정보 수정하기
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

