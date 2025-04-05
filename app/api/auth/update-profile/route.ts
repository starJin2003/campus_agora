import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = request.headers.get("Authorization")?.split(" ")[1] || cookies().get("token")?.value
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 요청 본문에서 프로필 데이터 가져오기
    const { name, department, profileImage } = await request.json()

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json({ error: "이름은 필수 항목입니다." }, { status: 400 })
    }

    // 프로필 업데이트
    await sql`
      UPDATE users
      SET 
        name = ${name},
        department = ${department},
        profile_image = ${profileImage},
        updated_at = NOW()
      WHERE id = ${user.userId}
    `

    // 업데이트된 사용자 정보 가져오기
    const [updatedUser] = await sql`
      SELECT id, email, name, department, university, profile_image, is_verified
      FROM users
      WHERE id = ${user.userId}
    `

    return NextResponse.json({
      success: true,
      message: "프로필이 성공적으로 업데이트되었습니다.",
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
    console.error("프로필 업데이트 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

