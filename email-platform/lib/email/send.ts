import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  if (!resend) resend = new Resend(key)
  return resend
}

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(input: SendEmailInput) {
  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

  const { data, error } = await getResend().emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
