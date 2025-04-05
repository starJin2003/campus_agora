"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  suppressConsole?: boolean
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: false } // 오류를 감지해도 UI를 변경하지 않음
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.suppressConsole && process.env.NODE_ENV === "development") {
      // 개발 환경에서 특정 오류 메시지 억제
      if (
        error.message.includes("Unexpected Fiber popped") ||
        error.message.includes("multiple renderers concurrently") ||
        error.message.includes("Cannot read properties of null")
      ) {
        return // 특정 오류 무시
      }
    }

    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback
    }

    return this.props.children
  }
}

export default ErrorBoundary

