import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value
    const user = await getCurrentUser()

    if (!user || !user.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    const { title, price, description, category, condition, location, image, universityId } = await request.json()

    // 필수 필드 검증
    if (!title || !price || !category || !condition || !location || !description) {
      return NextResponse.json({ error: "모든 필수 항목을 입력해주세요." }, { status: 400 })
    }

    // 대학 ID 검증
    if (!universityId) {
      return NextResponse.json({ error: "대학 정보가 필요합니다." }, { status: 400 })
    }

    // 데이터베이스에 물품 저장
    const [item] = await sql`
      INSERT INTO items (
        title, 
        price, 
        description, 
        category, 
        condition, 
        location, 
        image_url, 
        status, 
        seller_id,
        seller_name,
        seller_department
      )
      VALUES (
        ${title}, 
        ${Number(price)}, 
        ${description}, 
        ${category}, 
        ${condition}, 
        ${location}, 
        ${image || null}, 
        ${"available"}, 
        ${user.id},
        ${user.name || "익명"},
        ${user.department || null}
      )
      RETURNING id, title, price, created_at
    `

    // 물품-대학 관계 저장
    await sql`
      INSERT INTO item_universities (item_id, university_id)
      VALUES (${item.id}, ${universityId})
    `

    return NextResponse.json({
      success: true,
      message: "물품이 성공적으로 등록되었습니다.",
      item,
    })
  } catch (error) {
    console.error("물품 등록 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get("universityId")

    if (!universityId) {
      return NextResponse.json({ error: "대학 ID가 필요합니다." }, { status: 400 })
    }

    // 대학에 속한 물품 가져오기
    const items = await sql`
      SELECT i.* 
      FROM items i
      JOIN item_universities iu ON i.id = iu.item_id
      WHERE iu.university_id = ${universityId}
      AND i.status = 'available'
      ORDER BY i.created_at DESC
    `

    return NextResponse.json({ items })
  } catch (error) {
    console.error("물품 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

