import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import { getUniversityFromEmail } from "@/lib/auth-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    console.log("회원가입 요청 시작")

    const { email, name, password, department, university } = await request.json()
    console.log("요청 데이터:", { email, name, department, university, passwordLength: password?.length })

    // 필수 필드 검증
    if (!email || !name || !password) {
      console.log("필수 필드 누락:", { email: !!email, name: !!name, password: !!password })
      return NextResponse.json({ error: "모든 필수 항목을 입력해주세요." }, { status: 400 })
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.log("이메일 형식 오류:", email)
      return NextResponse.json({ error: "유효한 이메일 주소를 입력해주세요." }, { status: 400 })
    }

    // .edu 이메일 검증 추가
    if (!email.toLowerCase().endsWith(".edu")) {
      console.log(".edu 이메일 아님:", email)
      return NextResponse.json({ error: "교육기관 이메일(.edu로 끝나는 이메일)만 가입이 가능합니다." }, { status: 400 })
    }

    // 이미 등록된 이메일인지 확인
    console.log("이메일 중복 확인 중:", email)
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    console.log("이메일 중복 확인 결과:", existingUser.length > 0 ? "중복" : "사용 가능")

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "이미 등록된 이메일 주소입니다." }, { status: 400 })
    }

    // 비밀번호 해시화
    console.log("비밀번호 해시화 중")
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    console.log("비밀번호 해시화 완료")

    // 대학 정보 추출
    const universityName = university || getUniversityFromEmail(email)

    // 사용자 생성
    console.log("사용자 생성 중")
    try {
      const [user] = await sql`
        INSERT INTO users (email, name, password_hash, department, university, is_verified)
        VALUES (${email}, ${name}, ${hashedPassword}, ${department}, ${universityName}, false)
        RETURNING id, email, name
      `
      console.log("사용자 생성 완료:", user)

      // 인증 이메일 전송 요청
      console.log("인증 이메일 전송 요청 중")
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: user.name,
        }),
      }).catch((error) => {
        console.error("인증 이메일 전송 실패:", error)
      })

      return NextResponse.json({
        success: true,
        message: "회원가입이 완료되었습니다. 이메일을 확인하여 계정을 인증해주세요.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    } catch (dbError) {
      console.error("사용자 생성 SQL 오류:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("회원가입 오류:", error)
    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

