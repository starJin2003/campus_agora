import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getUniversityFromEmail } from "@/lib/university-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // 필수 필드 검증
    if (!email || !password) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해주세요." }, { status: 400 })
    }

    // 사용자 조회 - 프로필 이미지 필드 추가
    const users = await sql`
      SELECT id, email, name, password_hash, department, university, profile_image, is_verified
      FROM users
      WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    const user = users[0]

    // 이메일 인증 확인 부분 개선
    if (!user.is_verified) {
      console.log("이메일 인증 필요:", user.email)
      return NextResponse.json(
        {
          error: "이메일 인증이 완료되지 않았습니다. 이메일을 확인하여 계정을 인증해주세요.",
          needsVerification: true,
          userId: user.id,
          email: user.email,
          name: user.name,
        },
        { status: 403 },
      )
    }

    // 비밀번호 확인 부분 개선
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      console.log("비밀번호 불일치:", user.email)
      return NextResponse.json({ error: "이메일 또는 비밀번호가 일치하지 않습니다." }, { status: 401 })
    }

    // 대학 정보 가져오기
    let university = null
    try {
      // 이메일 도메인에서 대학 정보 가져오기
      university = await getUniversityFromEmail(email)

      // 사용자-대학 관계 확인 및 업데이트
      const userUniversities = await sql`
        SELECT * FROM user_universities 
        WHERE user_id = ${user.id} AND university_id = ${university.id}
      `

      // 관계가 없으면 추가
      if (userUniversities.length === 0 && university.id > 0) {
        await sql`
          INSERT INTO user_universities (user_id, university_id)
          VALUES (${user.id}, ${university.id})
        `
      }

      // 사용자 대학 정보 업데이트
      if (university.name && (!user.university || user.university !== university.name)) {
        await sql`
          UPDATE users
          SET university = ${university.name}
          WHERE id = ${user.id}
        `
        user.university = university.name
      }
    } catch (error) {
      console.error("Error getting university info:", error)
      // 대학 정보 가져오기 실패해도 로그인은 계속 진행
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    )

    // 민감한 정보 제외하고 사용자 정보 반환
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      university: user.university || (university ? university.name : null),
      profileImage: user.profile_image,
      isVerified: user.is_verified,
    }

    // 대학 정보 추가
    if (university) {
      userInfo.universityId = university.id
      userInfo.universitySlug = university.slug
    }

    return NextResponse.json({
      success: true,
      token,
      user: userInfo,
      university: university,
    })
  } catch (error) {
    console.error("로그인 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

