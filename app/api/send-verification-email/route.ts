import { Resend } from "resend"
import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { v4 as uuidv4 } from "uuid"

const resend = new Resend(process.env.RESEND_API_KEY)
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { userId, email, name } = await request.json()

    // 인증 토큰 생성
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료

    // 기존 토큰 삭제 후 새 토큰 저장
    await sql`
      DELETE FROM verification_tokens WHERE user_id = ${userId}
    `

    await sql`
      INSERT INTO verification_tokens (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `

    // 인증 링크 생성
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

    // 이메일 전송
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Campus Agora 이메일 인증",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Campus Agora 이메일 인증</h2>
          <p>안녕하세요, ${name}님!</p>
          <p>Campus Agora 회원가입을 완료하려면 아래 버튼을 클릭하여 이메일을 인증해주세요.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">이메일 인증하기</a>
          </div>
          <p>또는 다음 링크를 브라우저에 복사하여 붙여넣으세요:</p>
          <p>${verificationUrl}</p>
          <p>이 링크는 24시간 동안 유효합니다.</p>
          <p>감사합니다,<br>Campus Agora 팀</p>
        </div>
      `,
    })

    if (error) {
      console.error("이메일 전송 오류:", error)
      return NextResponse.json({ error: "이메일 전송 실패" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "인증 이메일이 전송되었습니다.",
    })
  } catch (error) {
    console.error("이메일 전송 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

