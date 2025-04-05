"use server"

import { neon } from "@neondatabase/serverless"
import type { Item, User } from "@/lib/types"

// Neon 데이터베이스 연결
const sql = neon(process.env.DATABASE_URL!)

// 사용자 아이템 동기화 함수
export async function syncUserItems(userId: string, items: Item[]) {
  try {
    // 1. 먼저 사용자의 기존 아이템을 가져옵니다
    const existingItems = await sql`
      SELECT id FROM items WHERE seller_id = ${userId}
    `

    const existingItemIds = existingItems.map((item) => item.id)

    // 2. 로컬 아이템을 서버에 동기화합니다
    for (const item of items) {
      if (existingItemIds.includes(item.id)) {
        // 기존 아이템 업데이트
        await sql`
          UPDATE items
          SET 
            title = ${item.title},
            price = ${item.price},
            description = ${item.description},
            category = ${item.category},
            condition = ${item.condition},
            location = ${item.location},
            image_url = ${item.image || null},
            status = ${item.status},
            updated_at = NOW()
          WHERE id = ${item.id} AND seller_id = ${userId}
        `
      } else {
        // 새 아이템 추가
        await sql`
          INSERT INTO items (
            id, title, price, description, category, condition, location, 
            image_url, status, seller_id, seller_name, seller_department
          )
          VALUES (
            ${item.id}, ${item.title}, ${item.price}, ${item.description}, 
            ${item.category}, ${item.condition}, ${item.location}, 
            ${item.image || null}, ${item.status}, ${userId}, 
            ${item.seller.name}, ${item.seller.department || null}
          )
          ON CONFLICT (id) DO NOTHING
        `

        // 아이템-대학 관계 저장 (대학 정보가 있는 경우)
        if (item.universityId) {
          await sql`
            INSERT INTO item_universities (item_id, university_id)
            VALUES (${item.id}, ${item.universityId})
            ON CONFLICT (item_id, university_id) DO NOTHING
          `
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("아이템 동기화 오류:", error)
    return { success: false, error }
  }
}

// 사용자 프로필 동기화 함수
export async function syncUserProfile(userId: string, userData: Partial<User>) {
  try {
    console.log("DB 프로필 동기화 시작:", userId, userData)

    // 사용자 프로필 업데이트
    const result = await sql`
      UPDATE users
      SET 
        name = COALESCE(${userData.name}, name),
        department = COALESCE(${userData.department}, department),
        profile_image = COALESCE(${userData.profileImage}, profile_image),
        updated_at = NOW()
      WHERE id = ${userId}
      RETURNING id, name, department, profile_image
    `

    console.log("DB 프로필 업데이트 결과:", result)

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("프로필 동기화 오류:", error)
    return { success: false, error }
  }
}

// 서버에서 사용자 아이템 가져오기
export async function fetchUserItems(userId: string) {
  try {
    const items = await sql`
      SELECT i.*, iu.university_id, u.name as university_name, u.slug as university_slug
      FROM items i
      LEFT JOIN item_universities iu ON i.id = iu.item_id
      LEFT JOIN universities u ON iu.university_id = u.id
      WHERE i.seller_id = ${userId}
      ORDER BY i.created_at DESC
    `

    // 결과를 클라이언트 모델에 맞게 변환
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      price: Number(item.price),
      description: item.description,
      image: item.image_url,
      category: item.category,
      condition: item.condition,
      location: item.location,
      status: item.status,
      createdAt: item.created_at,
      seller: {
        id: item.seller_id,
        name: item.seller_name,
        department: item.seller_department || "",
      },
      universityId: item.university_id,
      universityName: item.university_name,
      universitySlug: item.university_slug,
    }))
  } catch (error) {
    console.error("사용자 아이템 조회 오류:", error)
    return []
  }
}

// 대학별 아이템 가져오기 (최신 아이템)
export async function fetchUniversityItems(universityId: number, limit = 20) {
  try {
    const items = await sql`
      SELECT i.*, iu.university_id, u.name as university_name, u.slug as university_slug
      FROM items i
      JOIN item_universities iu ON i.id = iu.item_id
      JOIN universities u ON iu.university_id = u.id
      WHERE iu.university_id = ${universityId}
      AND i.status = 'available'
      ORDER BY i.created_at DESC
      LIMIT ${limit}
    `

    // 결과를 클라이언트 모델에 맞게 변환
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      price: Number(item.price),
      description: item.description,
      image: item.image_url,
      category: item.category,
      condition: item.condition,
      location: item.location,
      status: item.status,
      createdAt: item.created_at,
      seller: {
        id: item.seller_id,
        name: item.seller_name,
        department: item.seller_department || "",
      },
      universityId: item.university_id,
      universityName: item.university_name,
      universitySlug: item.university_slug,
    }))
  } catch (error) {
    console.error("대학 아이템 조회 오류:", error)
    return []
  }
}

// 특정 아이템 상세 정보 가져오기
export async function fetchItemDetails(itemId: string) {
  try {
    const items = await sql`
      SELECT i.*, iu.university_id, u.name as university_name, u.slug as university_slug
      FROM items i
      LEFT JOIN item_universities iu ON i.id = iu.item_id
      LEFT JOIN universities u ON iu.university_id = u.id
      WHERE i.id = ${itemId}
    `

    if (items.length === 0) {
      return null
    }

    const item = items[0]

    // 결과를 클라이언트 모델에 맞게 변환
    return {
      id: item.id,
      title: item.title,
      price: Number(item.price),
      description: item.description,
      image: item.image_url,
      category: item.category,
      condition: item.condition,
      location: item.location,
      status: item.status,
      createdAt: item.created_at,
      seller: {
        id: item.seller_id,
        name: item.seller_name,
        department: item.seller_department || "",
      },
      universityId: item.university_id,
      universityName: item.university_name,
      universitySlug: item.university_slug,
    }
  } catch (error) {
    console.error("아이템 상세 조회 오류:", error)
    return null
  }
}

