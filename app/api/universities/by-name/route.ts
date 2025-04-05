import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { createUniversitySlug } from "@/lib/university-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "대학 이름이 필요합니다." }, { status: 400 })
    }

    // 데이터베이스에서 대학 검색
    const universities = await sql`
      SELECT * FROM universities WHERE name = ${name}
    `

    if (universities.length > 0) {
      return NextResponse.json(universities[0])
    }

    // 대학이 없으면 슬러그만 생성해서 반환
    const slug = createUniversitySlug(name)

    return NextResponse.json({
      name,
      slug,
      exists: false,
    })
  } catch (error) {
    console.error("대학 검색 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

