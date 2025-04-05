import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // 쿠키에서 토큰 삭제
  cookies().delete("token")

  return NextResponse.json({
    success: true,
    message: "로그아웃되었습니다.",
  })
}

