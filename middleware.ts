import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

// 인증이 필요하지 않은 경로
const publicPaths = [
  "/auth/login",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password", // 비밀번호 재설정 페이지
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/verify-reset-token",
  "/api/auth/reset-password",
  "/api/send-verification-email",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 디버깅을 위한 로그 추가 (프로덕션에서는 제거 권장)
  // console.log("미들웨어 실행:", pathname)

  // 공개 경로인지 확인 (정확한 경로 매칭)
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  // API 경로 또는 정적 파일 또는 공개 경로는 처리하지 않음
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.includes(".") || isPublicPath) {
    // console.log("공개 경로 또는 정적 파일:", pathname)
    return NextResponse.next()
  }

  // 토큰 확인
  const token = request.cookies.get("token")?.value || request.headers.get("Authorization")?.split(" ")[1]

  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    // console.log("토큰 없음, 로그인 페이지로 리다이렉트:", pathname)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  try {
    // 토큰 검증
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    // console.log("토큰 검증 성공:", pathname)

    // 루트 경로 접근 시 대학 페이지로 리다이렉트
    if (pathname === "/") {
      // 사용자 정보에서 대학 슬러그 가져오기
      const userUniversitySlug = (payload as any).universitySlug

      if (userUniversitySlug) {
        return NextResponse.redirect(new URL(`/university/${userUniversitySlug}`, request.url))
      }
    }

    return NextResponse.next()
  } catch (error) {
    // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
    // console.log("토큰 검증 실패, 로그인 페이지로 리다이렉트:", pathname)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

// 미들웨어가 실행될 경로 지정
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}

