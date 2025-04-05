"use server"

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// 데이터베이스 연결 설정
const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)

// 데이터베이스 쿼리 헬퍼 함수
export async function executeQuery(query: string, params: any[] = []) {
  try {
    return await sql(query, params)
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

