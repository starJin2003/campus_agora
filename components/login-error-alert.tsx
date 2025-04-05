"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface LoginErrorAlertProps {
  message: string
}

export default function LoginErrorAlert({ message }: LoginErrorAlertProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>로그인 실패</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

