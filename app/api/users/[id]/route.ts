import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "사용자 ID가 필요합니다." }, { status: 400 })
    }

    // 사용자 정보 조회
    const users = await sql`
      SELECT id, name, email, department, university, profile_image, is_verified
      FROM users
      WHERE id = ${id}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 })
    }

    const user = users[0]

    // 민감한 정보 제외하고 반환
    return NextResponse.json({
      id: user.id,
      name: user.name,
      department: user.department,
      university: user.university,
      profileImage: user.profile_image,
      isVerified: user.is_verified,
    })
  } catch (error) {
    console.error("사용자 정보 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

