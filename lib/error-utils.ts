/**
 * 개발 환경에서 특정 콘솔 오류를 억제하는 함수
 */
export function suppressDevErrors() {
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // 원래 콘솔 에러 함수 저장
    const originalConsoleError = console.error

    // 콘솔 에러 함수 오버라이드
    console.error = (...args) => {
      // 특정 오류 메시지 필터링
      const errorMessage = args[0]?.toString() || ""

      if (
        errorMessage.includes("Unexpected Fiber popped") ||
        errorMessage.includes("multiple renderers concurrently") ||
        errorMessage.includes("Cannot read properties of null")
      ) {
        // 특정 오류 무시
        return
      }

      // 다른 오류는 정상적으로 출력
      originalConsoleError.apply(console, args)
    }
  }
}

