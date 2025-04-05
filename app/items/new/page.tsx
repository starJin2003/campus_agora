"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useItemStore } from "@/lib/store"
import { v4 as uuidv4 } from "uuid"

export default function NewItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { addItem } = useItemStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState<any>(null)
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

  // useEffect 내에서 컴포넌트 마운트 상태를 확인하는 로직 추가
  useEffect(() => {
    let isMounted = true

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (user && user.id && isMounted) {
        setUserData(user)
      } else if (isMounted) {
        // 로그인되지 않은 경우 로그인 페이지로 리디렉션
        toast({
          title: "로그인이 필요합니다",
          description: "물품을 등록하려면 먼저 로그인해주세요.",
          variant: "destructive",
        })
        router.push("/auth/login")
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
      if (isMounted) {
        toast({
          title: "오류가 발생했습니다",
          description: "사용자 정보를 불러올 수 없습니다.",
          variant: "destructive",
        })
      }
    }

    return () => {
      isMounted = false
    }
  }, [router, toast])

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

  // handleSubmit 함수에서 비동기 작업 처리 개선
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userData) {
      toast({
        title: "로그인이 필요합니다",
        description: "물품을 등록하려면 먼저 로그인해주세요.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    // 필수 필드 검증
    const requiredFields = ["title", "price", "category", "condition", "location", "description"]
    const emptyFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (emptyFields.length > 0) {
      toast({
        title: "필수 정보를 입력해주세요",
        description: "모든 필수 항목을 입력해야 물품을 등록할 수 있습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 새 물품 생성
      const newItem = {
        id: uuidv4(),
        title: formData.title,
        price: Number.parseInt(formData.price),
        description: formData.description,
        image: formData.image || "/placeholder.svg?height=300&width=300&text=상품+이미지",
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        status: "available" as const,
        createdAt: new Date().toISOString(),
        seller: {
          id: userData.id,
          name: userData.name,
          department: userData.department || "학과 정보 없음",
        },
      }

      // 상품 추가
      addItem(newItem)

      // 성공 메시지 표시
      toast({
        title: "물품 등록 완료",
        description: "물품이 성공적으로 등록되었습니다.",
      })

      // 홈페이지로 이동
      router.push("/")
    } catch (error) {
      console.error("Failed to add item:", error)
      toast({
        title: "물품 등록 실패",
        description: "물품 등록 중 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/" className="inline-flex items-center mb-6 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        돌아가기
      </Link>

      <h1 className="text-2xl font-bold mb-6">물품 등록하기</h1>

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
            <Select value={formData.location} onValueChange={(value) => handleSelectChange("location", value)}>
              <SelectTrigger id="location">
                <SelectValue placeholder="거래 장소 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="도서관">도서관</SelectItem>
                <SelectItem value="학생회관">학생회관</SelectItem>
                <SelectItem value="식당">식당</SelectItem>
                <SelectItem value="정문">정문</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
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
          {isSubmitting ? "등록 중..." : "물품 등록하기"}
        </Button>
      </form>
    </div>
  )
}

