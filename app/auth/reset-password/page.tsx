"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { toast } = useToast()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [tokenValid, setTokenValid] = useState(false)

  // 페이지 로드 시 디버깅 로그 추가
  useEffect(() => {
    console.log("비밀번호 재설정 페이지 로드됨")
    console.log("토큰:", token)
  }, [])

  // 토큰 유효성 검증
  useEffect(() => {
    if (!token) {
      console.log("토큰 없음")
      setError("유효하지 않은 비밀번호 재설정 링크입니다.")
      setIsVerifying(false)
      return
    }

    const verifyToken = async () => {
      try {
        console.log("토큰 검증 시작:", token)
        const response = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()
        console.log("토큰 검증 응답:", data)

        if (!response.ok) {
          setError(data.error || "유효하지 않은 비밀번호 재설정 링크입니다.")
          setTokenValid(false)
        } else {
          setTokenValid(true)
        }
      } catch (error) {
        console.error("Token verification error:", error)
        setError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
        setTokenValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      setIsLoading(false)
      return
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.")
      setIsLoading(false)
      return
    }

    try {
      console.log("비밀번호 재설정 요청 시작")
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()
      console.log("비밀번호 재설정 응답:", data)

      if (!response.ok) {
        setError(data.error || "비밀번호 재설정에 실패했습니다.")
        setIsLoading(false)
        return
      }

      setSuccess(data.message || "비밀번호가 성공적으로 재설정되었습니다.")
      toast({
        title: "비밀번호 재설정 완료",
        description: "새 비밀번호로 로그인할 수 있습니다.",
      })

      // 5초 후 로그인 페이지로 리다이렉트
      setTimeout(() => {
        router.push("/auth/login")
      }, 5000)
    } catch (error) {
      console.error("Reset password error:", error)
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
          <CardDescription className="text-center">새 비밀번호를 설정해주세요.</CardDescription>
        </CardHeader>

        {isVerifying ? (
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">토큰 검증 중...</p>
            <p className="text-muted-foreground mt-2">잠시만 기다려주세요.</p>
          </CardContent>
        ) : (
          <>
            {error && !tokenValid ? (
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="text-center mt-4">
                  <Link href="/auth/forgot-password">
                    <Button variant="outline">비밀번호 재설정 다시 요청하기</Button>
                  </Link>
                </div>
              </CardContent>
            ) : (
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
                      <AlertTitle>비밀번호 재설정 완료</AlertTitle>
                      <AlertDescription>
                        {success}
                        <p className="mt-2">5초 후 로그인 페이지로 이동합니다.</p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">새 비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={!!success}
                    />
                    <p className="text-xs text-muted-foreground">* 8자 이상, 영문, 숫자, 특수문자 포함</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={!!success}
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button type="submit" className="w-full" disabled={isLoading || !!success}>
                    {isLoading ? "처리 중..." : "비밀번호 재설정"}
                  </Button>
                  <Link href="/auth/login" className="w-full">
                    <Button variant="outline" className="w-full" type="button">
                      로그인 페이지로 돌아가기
                    </Button>
                  </Link>
                </CardFooter>
              </form>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

