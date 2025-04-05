/**
 * OpenAI 모델을 초기화하는 함수
 * 실제 OpenAI API 대신 모의 함수를 반환합니다.
 */
export function openai(model: string) {
  // 실제 구현에서는 OpenAI API 클라이언트를 초기화합니다.
  // 여기서는 모의 객체를 반환합니다.
  return {
    model,
    // 필요한 경우 추가 속성 및 메서드 구현
  }
}

/**
 * 텍스트를 생성하는 함수
 * 실제 AI 호출 대신 기본 텍스트를 반환합니다.
 */
export async function generateText({ model, prompt }: { model: any; prompt: string }) {
  // 실제 구현에서는 OpenAI API를 호출하여 텍스트를 생성합니다.
  // 여기서는 간단한 응답을 반환합니다.

  // 프롬프트에서 대학 이름 추출 시도
  const universityNameMatch = prompt.match(/["']([^"']+)["']/)
  const universityName = universityNameMatch ? universityNameMatch[1] : "the university"

  let text = ""

  if (prompt.includes("official full name")) {
    text = universityName
  } else if (prompt.includes("description")) {
    text = `${universityName} is an educational institution providing higher education to students. It offers various academic programs and research opportunities.`
  } else {
    text = `Response to: ${prompt}`
  }

  return { text }
}

