import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 클래스 이름 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 가격 포맷팅 함수 - 캐시 적용
const priceFormatCache = new Map<number, string>()

export function formatPrice(price: number): string {
  // 캐시에서 이미 포맷팅된 가격이 있는지 확인
  if (priceFormatCache.has(price)) {
    return priceFormatCache.get(price)!
  }

  // 새로운 포맷팅 생성 및 캐시에 저장
  const formatted = price.toLocaleString("ko-KR") + "원"
  priceFormatCache.set(price, formatted)
  return formatted
}

// 날짜 포맷팅 함수 - 캐시 적용
const dateFormatCache = new Map<string, string>()

export function formatDate(dateString: string): string {
  // 캐시에서 이미 포맷팅된 날짜가 있는지 확인
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!
  }

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffSeconds = Math.floor(diffTime / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  let formatted: string

  if (diffSeconds < 60) {
    formatted = "방금 전"
  } else if (diffMinutes < 60) {
    formatted = `${diffMinutes}분 전`
  } else if (diffHours < 24) {
    formatted = `${diffHours}시간 전`
  } else if (diffDays < 7) {
    formatted = `${diffDays}일 전`
  } else if (diffWeeks < 5) {
    formatted = `${diffWeeks}주 전`
  } else if (diffMonths < 12) {
    formatted = `${diffMonths}개월 전`
  } else {
    formatted = `${diffYears}년 전`
  }

  // 캐시에 저장 (최대 100개 항목으로 제한)
  if (dateFormatCache.size > 100) {
    // 가장 오래된 항목 제거 (간단한 구현)
    const firstKey = dateFormatCache.keys().next().value
    dateFormatCache.delete(firstKey)
  }

  dateFormatCache.set(dateString, formatted)
  return formatted
}

// 디바운스 함수 - 연속된 호출을 제한
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// 쓰로틀 함수 - 일정 시간 내 한 번만 실행
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

