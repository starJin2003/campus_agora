/**
 * 대학 설명을 생성하는 함수
 * 실제 AI 호출 대신 기본 설명을 반환합니다.
 */
export async function generateUniversityDescription(universityName: string): Promise<string> {
  // 실제 구현에서는 AI API를 호출하여 설명을 생성할 수 있습니다.
  // 여기서는 간단한 설명을 반환합니다.
  return `${universityName} is an educational institution providing higher education to students. It offers various academic programs and research opportunities.`
}

/**
 * 대학 공식 명칭을 생성하는 함수
 * 실제 AI 호출 대신 기본 이름을 반환합니다.
 */
export async function generateUniversityOfficialName(universityName: string): Promise<string> {
  // 실제 구현에서는 AI API를 호출하여 공식 명칭을 생성할 수 있습니다.
  // 여기서는 입력된 이름을 그대로 반환합니다.
  return universityName
}

