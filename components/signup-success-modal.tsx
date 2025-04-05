"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface SignupSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  universityName: string
}

export default function SignupSuccessModal({ isOpen, onClose, universityName }: SignupSuccessModalProps) {
  const router = useRouter()

  const handleLogin = () => {
    onClose()
    // 로그인 페이지로 이동하는 대신 이미 로그인 탭이 선택되어 있으므로 닫기만 함
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-2xl">회원가입 완료!</DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            <span className="font-medium text-primary">{universityName}</span>의 Campus Agora에 오신 것을 환영합니다!
            <br />
            이제 로그인하여 서비스를 이용할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center pt-4">
          <Button onClick={handleLogin} className="w-full sm:w-auto">
            로그인하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

