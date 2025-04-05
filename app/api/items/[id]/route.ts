import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { fetchItemDetails } from "@/lib/db-sync"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "상품 ID가 필요합니다." }, { status: 400 })
    }

    // 상품 상세 정보 가져오기
    const item = await fetchItemDetails(id)

    if (!item) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("상품 상세 정보 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

