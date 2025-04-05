"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Search, SlidersHorizontal, X } from "lucide-react"
import ItemCard from "@/components/item-card"
import { items } from "@/lib/data"
import type { Item } from "@/lib/types"
import MobileNav from "@/components/mobile-nav"
import { useSearchParams } from "next/navigation"

export default function ItemsPage() {
  const searchParams = useSearchParams()
  const initialSearchQuery = searchParams.get("search") || ""

  const [filteredItems, setFilteredItems] = useState<Item[]>(items)
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: {
      min: "",
      max: "",
    },
    condition: [] as string[],
    status: "all", // all, available, sold
  })
  const [sortOption, setSortOption] = useState("latest")

  // 카테고리 목록
  const categories = ["교재/책", "전자기기", "가구/인테리어", "의류/패션", "기타"]

  // 상태 목록
  const conditions = ["새 상품", "거의 새 상품", "상태 좋음", "사용감 있음", "상태 나쁨"]

  // 초기 검색어 적용
  useEffect(() => {
    if (initialSearchQuery) {
      handleSearch()
    }
  }, [initialSearchQuery])

  // 필터링 및 정렬 적용
  const handleSearch = () => {
    let result = [...items]

    // 검색어 필터링
    if (searchQuery) {
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // 카테고리 필터링
    if (filters.categories.length > 0) {
      result = result.filter((item) => filters.categories.includes(item.category))
    }

    // 가격 범위 필터링
    if (filters.priceRange.min) {
      result = result.filter((item) => item.price >= Number(filters.priceRange.min))
    }
    if (filters.priceRange.max) {
      result = result.filter((item) => item.price <= Number(filters.priceRange.max))
    }

    // 상태 필터링
    if (filters.condition.length > 0) {
      result = result.filter((item) => filters.condition.includes(item.condition))
    }

    // 판매 상태 필터링
    if (filters.status === "available") {
      result = result.filter((item) => item.status === "available")
    } else if (filters.status === "sold") {
      result = result.filter((item) => item.status === "sold")
    }

    // 정렬 적용
    switch (sortOption) {
      case "latest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case "priceLow":
        result.sort((a, b) => a.price - b.price)
        break
      case "priceHigh":
        result.sort((a, b) => b.price - a.price)
        break
    }

    setFilteredItems(result)
  }

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    handleSearch()
  }, [filters, sortOption])

  // 카테고리 필터 토글
  const toggleCategoryFilter = (category: string) => {
    setFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]

      return { ...prev, categories }
    })
  }

  // 상태 필터 토글
  const toggleConditionFilter = (condition: string) => {
    setFilters((prev) => {
      const conditions = prev.condition.includes(condition)
        ? prev.condition.filter((c) => c !== condition)
        : [...prev.condition, condition]

      return { ...prev, condition: conditions }
    })
  }

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      categories: [],
      priceRange: {
        min: "",
        max: "",
      },
      condition: [],
      status: "all",
    })
    setSearchQuery("")
    setSortOption("latest")
    handleSearch()
  }

  // 진짜 브라우저 뒤로가기 사용
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      <div className="flex items-center mb-6">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </button>
        <h1 className="text-2xl font-bold">모든 상품</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 필터 사이드바 (모바일에서는 토글) */}
        <div className={`md:w-64 space-y-6 ${showFilters ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between md:hidden mb-4">
            <h2 className="font-semibold">필터</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <h3 className="font-medium mb-2">카테고리</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => toggleCategoryFilter(category)}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm font-normal cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">가격 범위</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="최소"
                value={filters.priceRange.min}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, min: e.target.value },
                  }))
                }
              />
              <Input
                type="number"
                placeholder="최대"
                value={filters.priceRange.max}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: e.target.value },
                  }))
                }
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">상품 상태</h3>
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={`condition-${condition}`}
                    checked={filters.condition.includes(condition)}
                    onCheckedChange={() => toggleConditionFilter(condition)}
                  />
                  <Label htmlFor={`condition-${condition}`} className="text-sm font-normal cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">판매 상태</h3>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="판매 상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="available">판매중</SelectItem>
                <SelectItem value="sold">판매완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" className="w-full" onClick={resetFilters}>
            필터 초기화
          </Button>
        </div>

        {/* 상품 목록 */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 flex">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="찾고 있는 물품을 검색해보세요"
                className="pl-10 flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="ml-2 bg-primary hover:bg-primary/90" onClick={handleSearch}>
                검색
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                필터
              </Button>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                  <SelectItem value="priceLow">가격 낮은순</SelectItem>
                  <SelectItem value="priceHigh">가격 높은순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">검색 결과가 없습니다</h2>
              <p className="text-muted-foreground mb-6">다른 검색어나 필터 조건을 사용해보세요</p>
              <Button variant="outline" onClick={resetFilters}>
                필터 초기화
              </Button>
            </div>
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

