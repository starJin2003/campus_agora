// 로컬 스토리지 접근을 위한 유틸리티 함수

/**
 * 로컬 스토리지에서 값을 안전하게 가져오는 함수
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    // null 체크 추가
    if (item === null) {
      return defaultValue
    }

    // JSON 파싱 시도
    try {
      return JSON.parse(item) as T
    } catch (parseError) {
      console.error(`JSON 파싱 오류 (${key}):`, parseError)
      // JSON이 아닌 경우 문자열 그대로 반환 (타입 호환성 확인)
      return (typeof defaultValue === "string" ? item : defaultValue) as T
    }
  } catch (error) {
    console.error(`로컬 스토리지에서 ${key} 가져오기 오류:`, error)
    return defaultValue
  }
}

/**
 * 로컬 스토리지에 값을 안전하게 저장하는 함수
 */
export function setToStorage(key: string, value: any): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    // null이나 undefined 체크
    if (value === null || value === undefined) {
      localStorage.removeItem(key)
      return true
    }

    // 객체가 아닌 경우 직접 저장
    if (typeof value !== "object") {
      localStorage.setItem(key, String(value))
      return true
    }

    // 객체인 경우 JSON 문자열로 변환
    localStorage.setItem(key, JSON.stringify(value))

    // 사용자 정보인 경우 백업 저장
    if (key === "user") {
      localStorage.setItem("user_backup", JSON.stringify(value))
    }

    return true
  } catch (error) {
    console.error(`로컬 스토리지에 ${key} 저장 오류:`, error)
    // 스토리지 용량 초과 등의 오류 처리
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("로컬 스토리지 용량 초과. 공간 확보 시도 중...")
      // 오래된 데이터 정리 등의 추가 로직 구현 가능
    }
    return false
  }
}

/**
 * 로컬 스토리지에서 값을 안전하게 삭제하는 함수
 */
export function removeFromStorage(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`로컬 스토리지에서 ${key} 삭제 오류:`, error)
    return false
  }
}

/**
 * 현재 로그인한 사용자 정보를 가져오는 함수
 * 백업 파일이 있으면 그것을 우선 사용
 */
export function getCurrentUser() {
  try {
    // 기본 사용자 정보 가져오기
    const userData = getFromStorage<any>("user", null)

    // 백업 사용자 정보 가져오기 시도
    const backupUserData = getFromStorage<any>("user_backup", null)

    // 백업이 있고 기본 정보보다 더 많은 필드가 있으면 백업 사용
    if (backupUserData && userData) {
      // 백업에서 추가 필드 병합
      if (backupUserData.name && !userData.name) userData.name = backupUserData.name
      if (backupUserData.department && !userData.department) userData.department = backupUserData.department
      if (backupUserData.profileImage && !userData.profileImage) userData.profileImage = backupUserData.profileImage

      // 병합된 정보 저장
      setToStorage("user", userData)
    }

    return userData
  } catch (error) {
    console.error("사용자 정보 가져오기 오류:", error)
    return null
  }
}

/**
 * 로컬 스토리지 용량 확인 함수 (디버깅용)
 */
export function getLocalStorageSize(): { used: number; total: number; percentage: number } {
  if (typeof window === "undefined") {
    return { used: 0, total: 0, percentage: 0 }
  }

  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ""
        total += key.length + value.length
      }
    }
  } catch (e) {
    console.error("로컬 스토리지 크기 계산 오류:", e)
  }

  // 대략적인 localStorage 용량 (브라우저마다 다름, 보통 5-10MB)
  const estimatedTotal = 5 * 1024 * 1024 // 5MB
  const percentage = (total / estimatedTotal) * 100

  return {
    used: total,
    total: estimatedTotal,
    percentage,
  }
}

