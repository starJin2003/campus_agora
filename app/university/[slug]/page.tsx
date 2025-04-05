"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Search, Plus, SlidersHorizontal, X, AlertTriangle, Loader2 } from "lucide-react"
import ItemCard from "@/components/item-card"
import type { Item } from "@/lib/types"
import MobileNav from "@/components/mobile-nav"
import ProfileButton from "@/components/profile-button"
import { useRouter } from "next/navigation"
import { useUniversity } from "@/contexts/university-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import UniversityHeader from "@/components/university-header"
import { debounce } from "@/lib/utils"
import { useItemStore } from "@/lib/store"
import { getCurrentUser } from "@/lib/storage-utils"

export default function UniversityPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { university, isLoading: isUniversityLoading } = useUniversity()
  const { universityItems, setUniversityItems, items: allItems } = useItemStore() // 모든 아이템도 가져옴
  const [filteredItems, setFilteredItems] = useState<Item[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    categories: [] as string[],
    priceRange: {
      min: "",
      max: "",
    },
    condition: [] as string[],
  })
  const [sortOption, setSortOption] = useState("latest")
  const [loading, setLoading] = useState(true)
  const [pageUniversity, setPageUniversity] = useState<any>(null)
  const [universityDetails, setUniversityDetails] = useState<any>(null)
  const [isDifferentUniversity, setIsDifferentUniversity] = useState(false)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [currentUser, setCurrentUser] = useState<any>(null)

  // 카테고리 목록
  const categories = ["교재/책", "전자기기", "가구/인테리어", "의류/패션", "기타"]

  // 상태 목록
  const conditions = ["새 상품", "거의 새 상품", "상태 좋음", "사용감 있음", "상태 나쁨"]

  // 현재 사용자 정보 로드
  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      setCurrentUser(user)
    }
  }, [])

  // 대학 상세 정보 로드
  useEffect(() => {
    async function loadUniversityDetails() {
      try {
        const response = await fetch(`/api/universities/${params.slug}/details`)

        if (response.ok) {
          const data = await response.json()
          setPageUniversity(data.university)
          setUniversityDetails(data.details)
        } else {
          console.error("대학 상세 정보 로드 실패:", await response.text())
        }
      } catch (error) {
        console.error("대학 상세 정보 로드 오류:", error)
      }
    }

    if (params.slug) {
      loadUniversityDetails()
    }
  }, [params.slug])

  // 대학 물품 로드 (API + 스토어)
  const loadItems = useCallback(
    async (page = 1, searchTerm = searchQuery) => {
      try {
        setLoading(true)

        // 필터 파라미터 구성
        const queryParams = new URLSearchParams()
        queryParams.append("page", page.toString())
        queryParams.append("limit", pagination.limit.toString())

        if (searchTerm) {
          queryParams.append("search", searchTerm)
        }

        if (filters.categories.length > 0) {
          filters.categories.forEach((category) => {
            queryParams.append("category", category)
          })
        }

        if (filters.priceRange.min) {
          queryParams.append("minPrice", filters.priceRange.min)
        }

        if (filters.priceRange.max) {
          queryParams.append("maxPrice", filters.priceRange.max)
        }

        if (filters.condition.length > 0) {
          filters.condition.forEach((condition) => {
            queryParams.append("condition", condition)
          })
        }

        // API 호출
        const response = await fetch(`/api/universities/${params.slug}/items?${queryParams.toString()}`)

        if (response.ok) {
          const data = await response.json()

          // 대학 정보 저장
          if (data.university) {
            setPageUniversity(data.university)
          }

          // API에서 가져온 아이템 저장
          const apiItems = data.items || []

          // 스토어에 대학 아이템 업데이트
          setUniversityItems(apiItems)

          // 필터링 및 정렬 적용
          const sortedItems = [...apiItems].sort((a, b) => {
            switch (sortOption) {
              case "latest":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              case "priceLow":
                return a.price - b.price
              case "priceHigh":
                return b.price - a.price
              default:
                return 0
            }
          })

          setFilteredItems(sortedItems)

          setPagination(
            data.pagination || {
              total: apiItems.length,
              page,
              limit: pagination.limit,
              totalPages: Math.ceil(apiItems.length / pagination.limit),
            },
          )
        } else {
          console.error("대학 물품 로드 실패:", await response.text())
          // 스토어의 대학 아이템 사용
          applyFiltersToStoreItems()
        }
      } catch (error) {
        console.error("대학 물품 로드 오류:", error)
        // 오류 발생 시 스토어의 대학 아이템 사용
        applyFiltersToStoreItems()
      } finally {
        setLoading(false)
      }
    },
    [params.slug, filters, searchQuery, pagination.limit, sortOption, setUniversityItems],
  )

  // 스토어의 대학 아이템에 필터 적용 (내 아이템 포함)
  const applyFiltersToStoreItems = useCallback(() => {
    // 대학 아이템과 내가 등록한 아이템 중 현재 대학에 속한 아이템 합치기
    const combinedItems = [...universityItems]

    // 내가 등록한 아이템 중 현재 대학에 속한 아이템 추가 (중복 제거)
    if (currentUser && currentUser.id) {
      const myItems = allItems.filter(
        (item) =>
          item.seller.id === currentUser.id &&
          (item.universitySlug === params.slug || item.universityId === pageUniversity?.id),
      )

      // 중복 제거하며 합치기
      const existingIds = new Set(combinedItems.map((item) => item.id))
      for (const myItem of myItems) {
        if (!existingIds.has(myItem.id)) {
          combinedItems.push(myItem)
          existingIds.add(myItem.id)
        }
      }
    }

    let items = [...combinedItems]

    // 검색어 필터링
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // 카테고리 필터링
    if (filters.categories.length > 0) {
      items = items.filter((item) => filters.categories.includes(item.category))
    }

    // 가격 필터링
    if (filters.priceRange.min) {
      items = items.filter((item) => item.price >= Number(filters.priceRange.min))
    }

    if (filters.priceRange.max) {
      items = items.filter((item) => item.price <= Number(filters.priceRange.max))
    }

    // 상태 필터링
    if (filters.condition.length > 0) {
      items = items.filter((item) => filters.condition.includes(item.condition))
    }

    // 정렬 적용
    items.sort((a, b) => {
      switch (sortOption) {
        case "latest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "priceLow":
          return a.price - b.price
        case "priceHigh":
          return b.price - a.price
        default:
          return 0
      }
    })

    setFilteredItems(items)
  }, [universityItems, allItems, searchQuery, filters, sortOption, currentUser, params.slug, pageUniversity])

  // 초기 로드 및 필터 변경 시 아이템 로드
  useEffect(() => {
    if (params.slug) {
      loadItems(1)
    }
  }, [params.slug, filters, loadItems, sortOption])

  // 스토어의 대학 아이템이 변경될 때 필터 적용
  useEffect(() => {
    applyFiltersToStoreItems()
  }, [universityItems, allItems, applyFiltersToStoreItems, currentUser])

  // 검색어 변경 시 디바운스 적용
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      loadItems(1, value)
    }, 500),
    [loadItems],
  )

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    debouncedSearch(value)
  }

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadItems(1, searchQuery)
  }

  // 카테고리 필터 토글
  const toggleCategoryFilter = useCallback((category: string) => {
    setFilters((prev) => {
      const categories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]

      return { ...prev, categories }
    })
  }, [])

  // 상태 필터 토글
  const toggleConditionFilter = useCallback((condition: string) => {
    setFilters((prev) => {
      const conditions = prev.condition.includes(condition)
        ? prev.condition.filter((c) => c !== condition)
        : [...prev.condition, condition]

      return { ...prev, condition: conditions }
    })
  }, [])

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilters({
      categories: [],
      priceRange: {
        min: "",
        max: "",
      },
      condition: [],
    })
    setSearchQuery("")
    setSortOption("latest")
  }, [])

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadItems(newPage)
    }
  }

  // 대학 정보 확인 및 경고 표시
  useEffect(() => {
    if (!isUniversityLoading && university && pageUniversity) {
      // 사용자의 대학과 현재 페이지의 대학이 다른지 확인
      const isDifferent = university.slug !== params.slug
      setIsDifferentUniversity(isDifferent)

      if (isDifferent) {
        console.warn(`다른 대학 페이지에 접근 중입니다: ${params.slug} (내 대학: ${university.slug})`)
      }
    }
  }, [university, params.slug, isUniversityLoading, pageUniversity])

  // 로고 클릭 시 새로고침
  const handleLogoClick = useCallback(() => {
    resetFilters()
    if (university) {
      router.push(`/university/${university.slug}`)
    } else {
      router.push("/")
    }
  }, [resetFilters, router, university])

  // 내 대학으로 이동
  const goToMyUniversity = useCallback(() => {
    if (university) {
      router.push(`/university/${university.slug}`)
    }
  }, [university, router])

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8">
      {/* 대학 헤더 배너 */}
      {pageUniversity && (
        <UniversityHeader
          universityName={pageUniversity.name}
          universityDetails={{
            description: universityDetails?.description,
            location: universityDetails?.location,
            founded_year: universityDetails?.founded_year,
            website: universityDetails?.website,
            student_count: universityDetails?.student_count,
            logo_url: universityDetails?.logo_url,
            official_name: universityDetails?.official_name,
          }}
        />
      )}

      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
            <div className="flex items-center justify-center h-10 mr-2 text-primary">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="30" width="30" height="4" fill="currentColor" />
                <rect x="7" y="6" width="26" height="4" fill="currentColor" />
                <rect x="9" y="10" width="4" height="20" fill="currentColor" />
                <rect x="27" y="10" width="4" height="20" fill="currentColor" />
                <rect x="18" y="10" width="4" height="20" fill="currentColor" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-bold text-foreground leading-none">Campus Agora</h1>
              {pageUniversity && <p className="text-sm font-medium text-primary">at {pageUniversity.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProfileButton />
          </div>
        </div>

        {/* 다른 대학 경고 표시 */}
        {isDifferentUniversity && (
          <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle>다른 대학 페이지에 접속 중입니다</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>현재 {pageUniversity?.name} 페이지를 보고 있습니다. 내 대학 페이지로 이동하시겠습니까?</span>
              <Button variant="outline" size="sm" onClick={goToMyUniversity} className="sm:ml-auto">
                내 대학으로 이동
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 flex">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`${pageUniversity?.name || "대학"} 내 물품 검색하기`}
              className="pl-10 flex-1"
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="검색어 입력"
            />
            <Button type="submit" className="ml-2 bg-primary hover:bg-primary/90">
              검색
            </Button>
          </div>
        </form>
      </header>

      {/* 물품 등록 플로팅 버튼 */}
      <Link href={`/university/${params.slug}/create-item`} aria-label="물품 등록하기">
        <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 z-50 flex items-center justify-center text-white cursor-pointer">
          <Plus className="h-6 w-6" />
        </div>
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        {/* 필터 사이드바 (모바일에서는 토글) */}
        <div
          className={`md:w-64 space-y-6 ${showFilters ? "block" : "hidden md:block"} md:sticky md:top-4 md:self-start`}
        >
          <div className="flex items-center justify-between md:hidden mb-4">
            <h2 className="font-semibold">필터</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)} aria-label="필터 닫기">
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
                    aria-label={`카테고리: ${category}`}
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
                aria-label="최소 가격"
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
                aria-label="최대 가격"
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
                    aria-label={`상태: ${condition}`}
                  />
                  <Label htmlFor={`condition-${condition}`} className="text-sm font-normal cursor-pointer">
                    {condition}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={resetFilters}>
            필터 초기화
          </Button>
        </div>

        {/* 상품 목록 */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {pageUniversity ? (
                <span className="flex flex-col">
                  <span>{pageUniversity.name} 상품 목록</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {pageUniversity.name} 학생들이 판매 중인 상품입니다
                  </span>
                </span>
              ) : (
                "상품 목록"
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(true)}
                aria-label="필터 보기"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                필터
              </Button>

              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger className="w-[140px]" aria-label="정렬 기준 선택">
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

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">물품을 불러오는 중...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} isMyItem={currentUser && item.seller.id === currentUser.id} />
                ))}
              </div>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      이전
                    </Button>
                    <span className="text-sm">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </>
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

      <MobileNav universityName={pageUniversity?.name} />
    </div>
  )
}

