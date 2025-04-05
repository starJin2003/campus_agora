"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [errorDetails, setErrorDetails] = useState("")
  const [countdown, setCountdown] = useState(5)
  const [alreadyVerified, setAlreadyVerified] = useState(false)

  useEffect(() => {
    if (!token) {
      setIsVerifying(false)
      setError("유효하지 않은 인증 링크입니다.")
      setErrorDetails(
        "인증 링크에 토큰이 포함되어 있지 않습니다. 이메일을 다시 확인하거나 새 인증 이메일을 요청하세요.",
      )
      return
    }

    const verifyEmail = async () => {
      setIsVerifying(true)

      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (!response.ok) {
          setIsVerifying(false)
          setError(data.error || "이메일 인증에 실패했습니다.")

          if (data.expired) {
            setErrorDetails("인증 링크가 만료되었습니다. 로그인 페이지에서 새 인증 이메일을 요청하세요.")
          } else {
            setErrorDetails("인증 과정에서 문제가 발생했습니다. 다시 시도하거나 새 인증 이메일을 요청하세요.")
          }
          return
        }

        setIsVerifying(false)

        if (data.alreadyVerified) {
          setAlreadyVerified(true)
          setIsSuccess(true)
        } else {
          setIsSuccess(true)
        }

        // 카운트다운 시작
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              router.push("/auth/login")
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(interval)
      } catch (error) {
        console.error("Verification error:", error)
        setIsVerifying(false)
        setError("서버 오류가 발생했습니다.")
        setErrorDetails("서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-10 h-10 mr-2 text-primary">
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
            {isVerifying ? "이메일 인증 중..." : isSuccess ? "이메일 인증 완료" : "이메일 인증"}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center py-8">
          {isVerifying && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-lg font-medium">인증 중...</p>
              <p className="text-muted-foreground mt-2">잠시만 기다려주세요.</p>
            </div>
          )}

          {isSuccess && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">{alreadyVerified ? "이미 인증된 계정입니다" : "이메일 인증 완료!"}</p>
              <p className="text-muted-foreground mt-2">
                {alreadyVerified ? "이미 인증이 완료된 계정입니다." : "인증이 성공적으로 완료되었습니다."}
                {countdown}초 후 자동으로 로그인 페이지로 이동합니다.
                <br />
                로그인 페이지에서 가입한 이메일과 비밀번호로 로그인하세요.
              </p>

              <Alert className="mt-6 max-w-sm">
                <AlertTitle>인증 성공</AlertTitle>
                <AlertDescription>이제 Campus Agora 서비스를 이용하실 수 있습니다.</AlertDescription>
              </Alert>
            </div>
          )}

          {error && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium">인증 실패</p>
              <p className="text-muted-foreground mt-2">{error}</p>
              {errorDetails && <p className="text-sm text-muted-foreground mt-1">{errorDetails}</p>}

              <Alert variant="destructive" className="mt-6 max-w-sm">
                <AlertTitle>인증 오류</AlertTitle>
                <AlertDescription>인증 과정에서 문제가 발생했습니다. 다시 시도해주세요.</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          {isSuccess ? (
            <Link href="/auth/login">
              <Button>로그인 페이지로 이동</Button>
            </Link>
          ) : error ? (
            <Link href="/auth/login">
              <Button variant="outline">로그인 페이지로 돌아가기</Button>
            </Link>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}

