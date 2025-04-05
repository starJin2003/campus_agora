import Cookies from "js-cookie"

export function setAuthToken(token: string) {
  // 쿠키에 토큰 저장 (7일 유효)
  Cookies.set("token", token, { expires: 7, path: "/" })

  // 로컬 스토리지에도 저장 (클라이언트 측 접근용)
  localStorage.setItem("token", token)
}

export function getAuthToken() {
  return Cookies.get("token") || localStorage.getItem("token")
}

export function removeAuthToken() {
  // 쿠키에서 토큰 제거
  Cookies.remove("token")

  // 로컬 스토리지에서 토큰 제거
  localStorage.removeItem("token")

  // 로그인 상태만 변경하고 사용자 정보는 유지
  try {
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    userData.isLoggedIn = false
    localStorage.setItem("user", JSON.stringify(userData))
  } catch (error) {
    console.error("Failed to update user login state:", error)
  }
}

export function isAuthenticated() {
  const token = getAuthToken()
  if (!token) return false

  // 토큰이 있으면 사용자 정보에 로그인 상태 플래그 설정
  try {
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    userData.isLoggedIn = true
    localStorage.setItem("user", JSON.stringify(userData))
  } catch (error) {
    console.error("Failed to update user login state:", error)
  }

  return true
}

