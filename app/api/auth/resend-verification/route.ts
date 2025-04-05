import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json()

    if (!userId || !email || !name) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 })
    }

    // 인증 이메일 재전송
    const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-verification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        email,
        name,
      }),
    })

    if (!verificationResponse.ok) {
      return NextResponse.json({ error: "인증 이메일 전송에 실패했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "인증 이메일이 재전송되었습니다. 이메일을 확인해주세요.",
    })
  } catch (error) {
    console.error("인증 이메일 재전송 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

