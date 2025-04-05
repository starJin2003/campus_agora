import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { v4 as uuidv4 } from "uuid"
import { Resend } from "resend"

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 })
    }

    // .edu 이메일 검증
    if (!email.toLowerCase().endsWith(".edu")) {
      return NextResponse.json({ error: "교육기관 이메일(.edu로 끝나는 이메일)만 사용 가능합니다." }, { status: 400 })
    }

    // 사용자 확인
    const users = await sql`SELECT id, name, is_verified FROM users WHERE email = ${email}`

    if (users.length === 0) {
      // 보안을 위해 사용자가 없어도 성공 메시지 반환
      return NextResponse.json({
        success: true,
        message: "비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.",
      })
    }

    const user = users[0]

    // 이메일 인증 확인
    if (!user.is_verified) {
      return NextResponse.json({ error: "이메일 인증이 완료되지 않은 계정입니다." }, { status: 400 })
    }

    // 재설정 토큰 생성
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1시간 후 만료

    // 기존 토큰 삭제
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`

    // 새 토큰 저장
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // 재설정 링크 생성 - 여기서 URL을 수정합니다
    // 환경 변수에서 앱 URL을 가져오거나 기본값 사용
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

    // 이메일 전송
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: "Campus Agora 비밀번호 재설정",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Campus Agora 비밀번호 재설정</h2>
          <p>안녕하세요, ${user.name}님!</p>
          <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">비밀번호 재설정</a>
          </div>
          <p>또는 다음 링크를 브라우저에 복사하여 붙여넣으세요:</p>
          <p>${resetUrl}</p>
          <p>이 링크는 1시간 동안 유효합니다.</p>
          <p>비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
          <p>감사합니다,<br>Campus Agora 팀</p>
        </div>
      `,
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
      },
    })

    if (error) {
      console.error("이메일 전송 오류:", error)
      return NextResponse.json({ error: "이메일 전송에 실패했습니다." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "비밀번호 재설정 이메일이 전송되었습니다. 이메일을 확인해주세요.",
    })
  } catch (error) {
    console.error("비밀번호 찾기 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

