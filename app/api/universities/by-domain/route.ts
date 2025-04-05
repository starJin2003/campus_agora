import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getOrCreateUniversity, normalizeDomain } from "@/lib/university-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const domain = searchParams.get("domain")

    if (!domain) {
      return NextResponse.json({ error: "도메인이 필요합니다." }, { status: 400 })
    }

    // 도메인 정규화
    const normalizedDomain = normalizeDomain(domain)

    // 1. 먼저 데이터베이스에서 검색
    const universities = await sql`
      SELECT * FROM universities WHERE domain = ${normalizedDomain}
    `

    if (universities.length > 0) {
      return NextResponse.json(universities[0])
    }

    // 2. 데이터베이스에 없으면 생성
    const university = await getOrCreateUniversity(normalizedDomain)

    return NextResponse.json(university)
  } catch (error) {
    console.error("대학 정보 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

