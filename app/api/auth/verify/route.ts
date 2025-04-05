import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getOrCreateUniversity } from "@/lib/university-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // 요청 본문 파싱
    let token
    try {
      const body = await request.json()
      token = body.token
    } catch (error) {
      console.error("요청 본문 파싱 오류:", error)
      return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 })
    }

    // 토큰 조회
    let tokens
    try {
      tokens = await sql`
        SELECT user_id, expires_at 
        FROM verification_tokens 
        WHERE token = ${token}
      `
    } catch (error) {
      console.error("토큰 조회 오류:", error)
      return NextResponse.json({ error: "데이터베이스 조회 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다." }, { status: 400 })
    }

    const verificationToken = tokens[0]

    // 토큰 만료 확인
    if (new Date() > new Date(verificationToken.expires_at)) {
      console.log("토큰 만료됨:", verificationToken.expires_at)
      return NextResponse.json(
        {
          error: "만료된 토큰입니다. 다시 인증 이메일을 요청해주세요.",
          expired: true,
        },
        { status: 400 },
      )
    }

    // 사용자 정보 가져오기
    let users
    try {
      users = await sql`
        SELECT id, email, name, university, is_verified
        FROM users
        WHERE id = ${verificationToken.user_id}
      `
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error)
      return NextResponse.json({ error: "사용자 정보 조회 중 오류가 발생했습니다." }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 400 })
    }

    const user = users[0]

    // 이미 인증된 사용자인지 확인
    if (user.is_verified) {
      // 사용된 토큰 삭제
      try {
        await sql`DELETE FROM verification_tokens WHERE token = ${token}`
      } catch (error) {
        console.error("토큰 삭제 오류:", error)
        // 토큰 삭제 실패해도 계속 진행
      }

      return NextResponse.json({
        success: true,
        message: "이미 인증된 계정입니다. 로그인하여 서비스를 이용하세요.",
        alreadyVerified: true,
      })
    }

    // 사용자 인증 상태 업데이트
    try {
      await sql`
        UPDATE users 
        SET is_verified = true 
        WHERE id = ${verificationToken.user_id}
      `
      console.log("사용자 인증 완료:", verificationToken.user_id)
    } catch (error) {
      console.error("사용자 인증 상태 업데이트 오류:", error)
      return NextResponse.json({ error: "사용자 인증 상태 업데이트 중 오류가 발생했습니다." }, { status: 500 })
    }

    // 이메일 도메인에서 대학 정보 식별
    let university = null
    try {
      if (user.email) {
        const emailDomain = user.email.split("@")[1]
        university = await getOrCreateUniversity(emailDomain)
      }
    } catch (error) {
      console.error("대학 정보 처리 오류:", error)
      // 대학 정보 처리 실패해도 계속 진행
      university = { id: 0, name: "Unknown University", slug: "unknown" }
    }

    // 사용자-대학 관계 저장 (대학 정보가 있는 경우에만)
    if (university && university.id > 0) {
      try {
        await sql`
          INSERT INTO user_universities (user_id, university_id)
          VALUES (${user.id}, ${university.id})
          ON CONFLICT (user_id, university_id) DO NOTHING
        `
      } catch (error) {
        console.error("사용자-대학 관계 저장 오류:", error)
        // 관계 저장 실패해도 계속 진행
      }
    }

    // 사용자 대학 정보 업데이트 (대학 정보가 있는 경우에만)
    if (university && university.name) {
      try {
        await sql`
          UPDATE users
          SET university = ${university.name}
          WHERE id = ${user.id}
        `
      } catch (error) {
        console.error("사용자 대학 정보 업데이트 오류:", error)
        // 대학 정보 업데이트 실패해도 계속 진행
      }
    }

    // 사용된 토큰 삭제
    try {
      await sql`DELETE FROM verification_tokens WHERE token = ${token}`
    } catch (error) {
      console.error("토큰 삭제 오류:", error)
      // 토큰 삭제 실패해도 계속 진행
    }

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.",
      university: university
        ? {
            name: university.name,
            slug: university.slug,
          }
        : null,
    })
  } catch (error) {
    console.error("이메일 인증 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

