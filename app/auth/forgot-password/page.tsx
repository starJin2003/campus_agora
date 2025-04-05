"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // .edu 이메일 검증
    if (!email.toLowerCase().endsWith(".edu")) {
      setError("교육기관 이메일(.edu로 끝나는 이메일)만 사용 가능합니다.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "비밀번호 재설정 이메일 전송에 실패했습니다.")
        setIsLoading(false)
        return
      }

      setSuccess(data.message || "비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.")
      toast({
        title: "이메일 전송 완료",
        description: "비밀번호 재설정 이메일이 전송되었습니다.",
      })
    } catch (error) {
      console.error("Forgot password error:", error)
      setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center h-10 mr-2 text-primary">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="30" width="30" height="4" fill="currentColor" />
                <rect x="7" y="6" width="26" height="4" fill="currentColor" />
                <rect x="9" y="10" width="4" height="20" fill="currentColor" />
                <rect x="27" y="10" width="4" height="20" fill="currentColor" />
                <rect x="18" y="10" width="4" height="20" fill="currentColor" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-center">Campus Agora</CardTitle>
          </div>
          <CardDescription className="text-center">
            비밀번호를 잊으셨나요? 이메일을 입력하여 재설정 링크를 받으세요.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>이메일 전송 완료</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">교육 기관 이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading || !!success}>
              {isLoading ? "처리 중..." : "비밀번호 재설정 링크 받기"}
            </Button>
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="w-full" type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                로그인 페이지로 돌아가기
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

