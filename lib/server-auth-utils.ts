"use server"

import { hash, compare } from "bcryptjs"
import { executeQuery } from "./db"
import crypto from "crypto"

// 비밀번호 해시화 - 이미 async 함수
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12)
}

// 비밀번호 검증 - 이미 async 함수
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword)
}

// 인증 토큰 생성 - async로 변경
export async function generateVerificationToken(): Promise<string> {
  return crypto.randomBytes(32).toString("hex")
}

// 사용자 생성 - 이미 async 함수
export async function createUser(userData: {
  email: string
  name: string
  password: string
  department?: string
  university?: string
}) {
  const { email, name, password, department, university } = userData

  // 이메일 중복 확인
  const existingUser = await executeQuery("SELECT * FROM users WHERE email = $1", [email])

  if (existingUser.length > 0) {
    throw new Error("이미 등록된 이메일입니다.")
  }

  // 비밀번호 해시화
  const hashedPassword = await hashPassword(password)

  // 대학 정보 가져오기
  const universityName = university || ""

  // 사용자 생성
  const result = await executeQuery(
    "INSERT INTO users (email, name, password_hash, department, university) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [email, name, hashedPassword, department || null, universityName],
  )

  return result[0]
}

// 인증 토큰 생성 및 저장 - 이미 async 함수
export async function createVerificationToken(userId: string): Promise<string> {
  const token = await generateVerificationToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24시간 후 만료

  await executeQuery("INSERT INTO verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)", [
    userId,
    token,
    expiresAt,
  ])

  return token
}

// 토큰 검증 - 이미 async 함수
export async function verifyToken(token: string) {
  const result = await executeQuery(
    `SELECT vt.*, u.email, u.name 
     FROM verification_tokens vt 
     JOIN users u ON vt.user_id = u.id 
     WHERE vt.token = $1 AND vt.expires_at > NOW()`,
    [token],
  )

  if (result.length === 0) {
    return null
  }

  return result[0]
}

// 사용자 인증 상태 업데이트 - 이미 async 함수
export async function verifyUser(userId: string) {
  await executeQuery("UPDATE users SET is_verified = TRUE WHERE id = $1", [userId])

  // 사용된 토큰 삭제
  await executeQuery("DELETE FROM verification_tokens WHERE user_id = $1", [userId])
}

// 사용자 로그인 - 이미 async 함수
export async function loginUser(email: string, password: string) {
  // 사용자 조회
  const users = await executeQuery("SELECT * FROM users WHERE email = $1", [email])

  if (users.length === 0) {
    return null
  }

  const user = users[0]

  // 비밀번호 검증
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    return null
  }

  // 인증 여부 확인
  if (!user.is_verified) {
    throw new Error("이메일 인증이 완료되지 않았습니다.")
  }

  // 민감한 정보 제거
  delete user.password_hash

  return user
}

