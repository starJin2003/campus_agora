import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

const sql = neon(process.env.DATABASE_URL!)

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 요청 본문에서 상태 가져오기
    const { status } = await request.json()

    if (!status || !["available", "sold"].includes(status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 })
    }

    // 아이템 소유자 확인
    const items = await sql`
      SELECT seller_id FROM items WHERE id = ${id}
    `

    if (items.length === 0) {
      return NextResponse.json({ error: "아이템을 찾을 수 없습니다." }, { status: 404 })
    }

    const item = items[0]

    if (item.seller_id !== user.userId) {
      return NextResponse.json({ error: "이 아이템을 수정할 권한이 없습니다." }, { status: 403 })
    }

    // 아이템 상태 업데이트
    await sql`
      UPDATE items
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: "아이템 상태가 성공적으로 업데이트되었습니다.",
    })
  } catch (error) {
    console.error("아이템 상태 업데이트 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

