import { Resend } from "resend"

// Resend 인스턴스 생성
const resend = new Resend(process.env.RESEND_API_KEY)

// 인증 이메일 전송 함수
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`

  try {
    const { data, error } = await resend.emails.send({
      from: `Campus Agora <${process.env.EMAIL_FROM || "noreply@campusagora.com"}>`,
      to: email,
      subject: "Campus Agora 이메일 인증",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0284c7; text-align: center;">Campus Agora 이메일 인증</h2>
          <p>안녕하세요, ${name}님!</p>
          <p>Campus Agora 회원가입을 완료하려면 아래 버튼을 클릭하여 이메일을 인증해주세요.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">이메일 인증하기</a>
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
      throw new Error("이메일 전송에 실패했습니다.")
    }

    return data
  } catch (error) {
    console.error("이메일 전송 오류:", error)
    throw error
  }
}

