import { NextResponse } from "next/server"
import { syncUserProfile } from "@/lib/db-sync"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 요청 본문에서 프로필 데이터 가져오기
    const userData = await request.json()
    console.log("프로필 업데이트 요청 데이터:", userData)

    // 프로필 동기화
    const result = await syncUserProfile(user.userId, userData)

    if (!result.success) {
      console.error("프로필 동기화 실패:", result.error)
      return NextResponse.json({ error: "프로필 동기화 실패" }, { status: 500 })
    }

    // 업데이트된 사용자 정보 가져오기
    const [updatedUser] = await sql`
      SELECT id, email, name, department, university, profile_image, is_verified
      FROM users
      WHERE id = ${user.userId}
    `

    console.log("업데이트된 사용자 정보:", updatedUser)

    return NextResponse.json({
      success: true,
      message: "프로필이 성공적으로 동기화되었습니다.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        department: updatedUser.department,
        university: updatedUser.university,
        profileImage: updatedUser.profile_image,
        isVerified: updatedUser.is_verified,
      },
    })
  } catch (error) {
    console.error("프로필 동기화 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value || request.headers.get("Authorization")?.replace("Bearer ", "")
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 사용자 정보 가져오기
    const [userData] = await sql`
      SELECT id, email, name, department, university, profile_image, is_verified
      FROM users
      WHERE id = ${user.userId}
    `

    // 대학 정보 가져오기
    let universityData = null
    if (userData.university) {
      const universities = await sql`
        SELECT id, name, slug FROM universities WHERE name = ${userData.university}
      `
      if (universities.length > 0) {
        universityData = universities[0]
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        department: userData.department,
        university: userData.university,
        profileImage: userData.profile_image,
        isVerified: userData.is_verified,
        universityId: universityData?.id,
        universitySlug: universityData?.slug,
      },
    })
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

