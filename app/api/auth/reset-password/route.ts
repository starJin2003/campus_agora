import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "토큰과 비밀번호가 필요합니다." }, { status: 400 })
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 })
    }

    // 토큰 유효성 검증
    const tokens = await sql`
      SELECT user_id, expires_at 
      FROM password_reset_tokens 
      WHERE token = ${token}
    `

    if (tokens.length === 0) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 })
    }

    const resetToken = tokens[0]

    // 토큰 만료 확인
    if (new Date() > new Date(resetToken.expires_at)) {
      return NextResponse.json({ error: "만료된 토큰입니다. 다시 비밀번호 재설정을 요청해주세요." }, { status: 400 })
    }

    // 비밀번호 해시화
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 비밀번호 업데이트
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword} 
      WHERE id = ${resetToken.user_id}
    `

    // 사용된 토큰 삭제
    await sql`
      DELETE FROM password_reset_tokens 
      WHERE token = ${token}
    `

    return NextResponse.json({
      success: true,
      message: "비밀번호가 성공적으로 재설정되었습니다.",
    })
  } catch (error) {
    console.error("비밀번호 재설정 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

