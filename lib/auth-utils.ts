// 클라이언트 측에서 사용할 유틸리티 함수만 포함

// 대학교 이름 추출
export function getUniversityFromEmail(email: string): string {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return "Unknown University"
  }

  try {
    const domain = email.split("@")[1].toLowerCase()

    // 대학 도메인 매핑 (실제로는 더 많은 대학을 추가해야 함)
    const universityMap: Record<string, string> = {
      "harvard.edu": "Harvard University",
      "stanford.edu": "Stanford University",
      "mit.edu": "Massachusetts Institute of Technology",
      "berkeley.edu": "University of California, Berkeley",
      // 더 많은 대학 추가 가능
    }

    return (
      universityMap[domain] ||
      domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1) + " University"
    )
  } catch (error) {
    console.error("대학 이름 추출 오류:", error)
    return "Unknown University"
  }
}

// 이메일 도메인이 교육기관인지 확인
export function isEducationalEmail(email: string): boolean {
  // 개발 환경에서는 모든 이메일 허용
  if (process.env.NODE_ENV === "development") {
    return true
  }

  // .edu 도메인 확인
  return email.endsWith(".edu") || email.includes(".edu.")
}

