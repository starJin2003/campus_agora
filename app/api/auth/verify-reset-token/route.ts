import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    console.log("토큰 검증 요청:", token)

    if (!token) {
      return NextResponse.json({ error: "토큰이 제공되지 않았습니다." }, { status: 400 })
    }

    // 토큰 유효성 검증
    const tokens = await sql`
      SELECT user_id, expires_at 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

    console.log("토큰 검증 결과:", tokens.length > 0 ? "토큰 찾음" : "토큰 없음")

    if (tokens.length === 0) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 })
    }

    const resetToken = tokens[0]

    // 토큰 만료 확인
    const now = new Date()
    const expiresAt = new Date(resetToken.expires_at)
    console.log("토큰 만료 시간:", expiresAt, "현재 시간:", now)

    if (now > expiresAt) {
      return NextResponse.json({ error: "만료된 토큰입니다. 다시 비밀번호 재설정을 요청해주세요." }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "유효한 토큰입니다.",
    })
  } catch (error) {
    console.error("토큰 검증 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

