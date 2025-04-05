import { NextResponse } from "next/server"
import { getUniversityDetails } from "@/lib/university-utils"

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    // 대학 상세 정보 가져오기
    const universityData = await getUniversityDetails(slug)

    if (!universityData) {
      return NextResponse.json({ error: "대학을 찾을 수 없습니다." }, { status: 404 })
    }

    // 응답 데이터 구성
    return NextResponse.json({
      university: {
        id: universityData.id,
        name: universityData.name,
        slug: universityData.slug,
        domain: universityData.domain,
        official_name: universityData.details?.official_name || universityData.name, // 공식 명칭 추가
      },
      details: universityData.details || null,
    })
  } catch (error) {
    console.error("대학 상세 정보 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

