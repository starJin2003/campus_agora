import { neon } from "@neondatabase/serverless"
import slugify from "slugify"

const sql = neon(process.env.DATABASE_URL!)

// 대학 도메인 매핑 (예시)
const UNIVERSITY_DOMAINS: Record<string, string> = {
  "harvard.edu": "Harvard University",
  "stanford.edu": "Stanford University",
  "mit.edu": "Massachusetts Institute of Technology",
  "berkeley.edu": "University of California, Berkeley",
  "ucla.edu": "University of California, Los Angeles",
  // 추가 대학 도메인 매핑
}

// 이메일 도메인에서 대학 이름 추출
export function getUniversityNameFromDomain(domain: string): string {
  // 매핑된 대학 이름이 있으면 반환
  if (UNIVERSITY_DOMAINS[domain]) {
    return UNIVERSITY_DOMAINS[domain]
  }

  // 매핑이 없는 경우 도메인에서 대학 이름 추출 시도
  try {
    // 도메인에서 TLD 제거 (.edu, .ac.kr 등)
    const parts = domain.split(".")
    if (parts.length >= 2) {
      // 마지막 두 부분 제거 (예: .ac.kr, .edu)
      parts.pop() // TLD 제거 (.kr, .edu 등)

      // 대학 이름 부분 (보통 도메인의 첫 부분)
      const universityPart = parts.pop() || domain

      // 첫 글자 대문자로 변환하고 나머지는 소문자로
      const formattedName = universityPart.charAt(0).toUpperCase() + universityPart.slice(1).toLowerCase()

      // 대학 이름 형식으로 변환 (예: "harvard" -> "Harvard University")
      return `${formattedName} University`
    }
  } catch (error) {
    console.error("대학 이름 추출 오류:", error)
  }

  // 추출 실패 시 기본값 반환
  return "Unknown University"
}

// 대학 정보 가져오기 또는 생성
export async function getOrCreateUniversity(domain: string) {
  try {
    if (!domain) {
      throw new Error("도메인이 제공되지 않았습니다.")
    }

    // 먼저 데이터베이스에서 대학 정보 조회
    const universities = await sql`
      SELECT id, name, slug FROM universities WHERE domain = ${domain}
    `

    // 이미 존재하는 경우 반환
    if (universities.length > 0) {
      return universities[0]
    }

    // 존재하지 않는 경우 새로 생성
    const universityName = getUniversityNameFromDomain(domain)
    const slug = slugify(universityName, { lower: true })

    const newUniversity = await sql`
      INSERT INTO universities (name, domain, slug)
      VALUES (${universityName}, ${domain}, ${slug})
      RETURNING id, name, slug
    `

    if (newUniversity.length > 0) {
      return newUniversity[0]
    }

    throw new Error("대학 정보 생성 실패")
  } catch (error) {
    console.error("대학 정보 처리 오류:", error)

    // 오류 발생 시 기본 대학 정보 반환
    return {
      id: 0,
      name: "Unknown University",
      slug: "unknown",
    }
  }
}

// 이메일에서 대학 정보 추출
export async function getUniversityFromEmail(email: string) {
  try {
    if (!email || !email.includes("@")) {
      throw new Error("유효하지 않은 이메일 형식입니다.")
    }

    const domain = email.split("@")[1]
    return await getOrCreateUniversity(domain)
  } catch (error) {
    console.error("이메일에서 대학 정보 추출 오류:", error)

    // 오류 발생 시 기본 대학 정보 반환
    return {
      id: 0,
      name: "Unknown University",
      slug: "unknown",
    }
  }
}

// 도메인 정규화
export function normalizeDomain(domain: string): string {
  if (!domain) return ""
  let normalized = domain.toLowerCase()
  if (!normalized.startsWith("www.") && !normalized.includes(".")) {
    normalized = "www." + normalized
  }
  return normalized
}

// 대학 슬러그 생성
export function createUniversitySlug(name: string): string {
  return slugify(name, { lower: true })
}

// 대학 상세 정보 가져오기
export async function getUniversityDetails(slug: string) {
  try {
    const universities = await sql`
      SELECT id, name, domain, slug FROM universities WHERE slug = ${slug}
    `

    if (universities.length === 0) {
      return null
    }

    const university = universities[0]

    // 대학 상세 정보 테이블이 있는지 확인
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'university_details'
      ) as exists
    `

    let details = null
    if (tableExists[0].exists) {
      const detailsResult = await sql`
        SELECT * FROM university_details WHERE university_id = ${university.id}
      `
      details = detailsResult.length > 0 ? detailsResult[0] : null
    }

    return {
      university,
      details,
    }
  } catch (error) {
    console.error("대학 상세 정보 조회 오류:", error)
    return null
  }
}

// 슬러그로 대학 정보 가져오기
export async function getUniversityBySlug(slug: string) {
  try {
    const universities = await sql`
      SELECT id, name, domain, slug FROM universities WHERE slug = ${slug}
    `

    if (universities.length === 0) {
      return null
    }

    return universities[0]
  } catch (error) {
    console.error("대학 정보 조회 오류:", error)
    return null
  }
}

