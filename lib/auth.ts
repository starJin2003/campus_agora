import { jwtVerify } from "jose"
import { getFromStorage } from "./storage-utils"

// getUser 함수 수정
export async function getUser(token?: string) {
  // 직접 전달받은 토큰 사용
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    return payload
  } catch (error) {
    return null
  }
}

export function getCurrentUser() {
  try {
    return getFromStorage<any>("user", null)
  } catch (error) {
    console.error("사용자 정보 가져오기 오류:", error)
    return null
  }
}

