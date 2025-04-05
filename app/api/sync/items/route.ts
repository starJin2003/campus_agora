import { NextResponse } from "next/server"
import { syncUserItems, fetchUserItems, fetchUniversityItems } from "@/lib/db-sync"
import { getCurrentUser } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 요청 본문에서 아이템 데이터 가져오기
    const { items } = await request.json()

    // 아이템 동기화
    const result = await syncUserItems(user.userId, items)

    if (!result.success) {
      return NextResponse.json({ error: "아이템 동기화 실패" }, { status: 500 })
    }

    // 동기화 후 최신 아이템 목록 반환
    const updatedItems = await fetchUserItems(user.userId)

    // 사용자의 대학 아이템도 함께 반환 (대학 ID가 있는 경우)
    let universityItems = []
    if (user.universityId) {
      universityItems = await fetchUniversityItems(user.universityId)
    }

    return NextResponse.json({
      success: true,
      message: "아이템이 성공적으로 동기화되었습니다.",
      items: updatedItems,
      universityItems: universityItems,
    })
  } catch (error) {
    console.error("아이템 동기화 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    // 토큰에서 사용자 정보 가져오기
    const token = cookies().get("token")?.value
    const user = await getCurrentUser(token)

    if (!user || !user.userId) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다." }, { status: 401 })
    }

    // 사용자 아이템 가져오기
    const items = await fetchUserItems(user.userId)

    // 사용자의 대학 아이템도 함께 반환 (대학 ID가 있는 경우)
    let universityItems = []
    if (user.universityId) {
      universityItems = await fetchUniversityItems(user.universityId)
    }

    return NextResponse.json({
      items,
      universityItems,
    })
  } catch (error) {
    console.error("아이템 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

