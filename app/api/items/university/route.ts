import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { itemId, universityId } = await request.json()

    if (!itemId || !universityId) {
      return NextResponse.json({ error: "물품 ID와 대학 ID가 필요합니다." }, { status: 400 })
    }

    // 물품-대학 관계 저장
    await sql`
      INSERT INTO item_universities (item_id, university_id)
      VALUES (${itemId}, ${universityId})
      ON CONFLICT (item_id, university_id) DO NOTHING
    `

    return NextResponse.json({
      success: true,
      message: "물품-대학 관계가 저장되었습니다.",
    })
  } catch (error) {
    console.error("물품-대학 관계 저장 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

