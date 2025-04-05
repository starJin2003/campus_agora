import type React from "react"
import "./globals.css"
import { Providers } from "./providers"
import { suppressDevErrors } from "@/lib/error-utils"

// 개발 환경에서 특정 오류 메시지 억제
if (process.env.NODE_ENV === "development") {
  suppressDevErrors()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
