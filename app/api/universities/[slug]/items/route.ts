import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getUniversityBySlug } from "@/lib/university-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)

    // 페이지네이션 및 필터링 파라미터
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const category = searchParams.get("category")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const condition = searchParams.get("condition")
    const search = searchParams.get("search")

    const offset = (page - 1) * limit

    // 대학 정보 가져오기
    const university = await getUniversityBySlug(slug)

    if (!university) {
      return NextResponse.json({ error: "대학을 찾을 수 없습니다." }, { status: 404 })
    }

    // 쿼리 빌더 시작
    let query = `
      SELECT i.* 
      FROM items i
      JOIN item_universities iu ON i.id = iu.item_id
      WHERE iu.university_id = $1
      AND i.status = 'available'
    `

    const queryParams: any[] = [university.id]
    let paramIndex = 2

    // 검색어 필터
    if (search) {
      query += ` AND (i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    // 카테고리 필터
    if (category) {
      query += ` AND i.category = $${paramIndex}`
      queryParams.push(category)
      paramIndex++
    }

    // 가격 범위 필터
    if (minPrice) {
      query += ` AND i.price >= $${paramIndex}`
      queryParams.push(Number.parseInt(minPrice))
      paramIndex++
    }

    if (maxPrice) {
      query += ` AND i.price <= $${paramIndex}`
      queryParams.push(Number.parseInt(maxPrice))
      paramIndex++
    }

    // 상태 필터
    if (condition) {
      query += ` AND i.condition = $${paramIndex}`
      queryParams.push(condition)
      paramIndex++
    }

    // 정렬 및 페이지네이션
    query += ` ORDER BY i.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    queryParams.push(limit, offset)

    // 쿼리 실행
    const items = await sql.query(query, queryParams)

    // 전체 아이템 수 가져오기 (페이지네이션용)
    let countQuery = `
      SELECT COUNT(*) as total
      FROM items i
      JOIN item_universities iu ON i.id = iu.item_id
      WHERE iu.university_id = $1
      AND i.status = 'available'
    `

    const countParams = [university.id]
    paramIndex = 2

    // 검색어 필터
    if (search) {
      countQuery += ` AND (i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`
      countParams.push(`%${search}%`)
      paramIndex++
    }

    // 카테고리 필터
    if (category) {
      countQuery += ` AND i.category = $${paramIndex}`
      countParams.push(category)
      paramIndex++
    }

    // 가격 범위 필터
    if (minPrice) {
      countQuery += ` AND i.price >= $${paramIndex}`
      countParams.push(Number.parseInt(minPrice))
      paramIndex++
    }

    if (maxPrice) {
      countQuery += ` AND i.price <= $${paramIndex}`
      countParams.push(Number.parseInt(maxPrice))
      paramIndex++
    }

    // 상태 필터
    if (condition) {
      countQuery += ` AND i.condition = $${paramIndex}`
      countParams.push(condition)
      paramIndex++
    }

    const totalResult = await sql.query(countQuery, countParams)
    const total = Number.parseInt(totalResult.rows[0].total)

    // 응답에 대학 정보도 포함
    return NextResponse.json({
      university: {
        id: university.id,
        name: university.name,
        slug: university.slug,
        domain: university.domain,
      },
      items: items.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("대학 물품 조회 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

