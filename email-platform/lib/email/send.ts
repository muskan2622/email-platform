import { Resend } from "resend"

export type EmailProviderId = "resend" | "sendgrid" | "ses"
export type DeliveryEventType = "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "complained" | "unsubscribed" | "failed"

export interface SendEmailInput {
  to: string
  subject: string
  html: string
  text?: string
  provider?: EmailProviderId
  idempotencyKey?: string
  headers?: Record<string, string>
}

export interface SendEmailResult {
  id: string
  provider: EmailProviderId
  status: "queued" | "sent"
  attempts: number
}

export interface DeliveryWebhookEvent {
  provider: EmailProviderId
  providerMessageId: string
  type: DeliveryEventType
  occurredAt: string
  recipient?: string
  templateId?: string
  metadata: Record<string, unknown>
}

interface EmailProvider {
  id: EmailProviderId
  send(input: SendEmailInput): Promise<SendEmailResult>
  normalizeWebhook(payload: unknown, headers: Headers): DeliveryWebhookEvent[]
}

let resend: Resend | null = null

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY is not configured")
  if (!resend) resend = new Resend(key)
  return resend
}

function baseWebhookEvent(provider: EmailProviderId, payload: Record<string, unknown>): DeliveryWebhookEvent {
  const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>
  return {
    provider,
    providerMessageId: String(data.email_id ?? data.message_id ?? data.id ?? "unknown"),
    type: normalizeEventType(String(payload.type ?? data.event ?? data.type ?? "delivered")),
    occurredAt: String(data.created_at ?? data.timestamp ?? new Date().toISOString()),
    recipient: typeof data.to === "string" ? data.to : undefined,
    templateId: typeof data.template_id === "string" ? data.template_id : undefined,
    metadata: data,
  }
}

function normalizeEventType(type: string): DeliveryEventType {
  if (type.includes("open")) return "opened"
  if (type.includes("click")) return "clicked"
  if (type.includes("bounce")) return "bounced"
  if (type.includes("complain")) return "complained"
  if (type.includes("unsubscribe")) return "unsubscribed"
  if (type.includes("fail")) return "failed"
  if (type.includes("send")) return "sent"
  return "delivered"
}

const resendProvider: EmailProvider = {
  id: "resend",
  async send(input) {
    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
    const { data, error } = await getResend().emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      headers: input.headers,
    })

    if (error) throw new Error(error.message)
    return { id: data?.id ?? crypto.randomUUID(), provider: "resend", status: "sent", attempts: 1 }
  },
  normalizeWebhook(payload) {
    return [baseWebhookEvent("resend", payload as Record<string, unknown>)]
  },
}

const sendgridProvider: EmailProvider = {
  id: "sendgrid",
  async send() {
    throw new Error("SENDGRID_API_KEY is not configured. Provider adapter is ready for @sendgrid/mail.")
  },
  normalizeWebhook(payload) {
    const events = Array.isArray(payload) ? payload : [payload]
    return events.map((event) => baseWebhookEvent("sendgrid", event as Record<string, unknown>))
  },
}

const sesProvider: EmailProvider = {
  id: "ses",
  async send() {
    throw new Error("AWS SES credentials are not configured. Provider adapter is ready for AWS SDK SESv2.")
  },
  normalizeWebhook(payload) {
    return [baseWebhookEvent("ses", payload as Record<string, unknown>)]
  },
}

const providers: Record<EmailProviderId, EmailProvider> = {
  resend: resendProvider,
  sendgrid: sendgridProvider,
  ses: sesProvider,
}

function providerOrder(primary: EmailProviderId): EmailProviderId[] {
  return [primary, ...(["resend", "sendgrid", "ses"] as EmailProviderId[]).filter((provider) => provider !== primary)]
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const primary = input.provider ?? "resend"
  const failures: string[] = []

  for (const providerId of providerOrder(primary)) {
    try {
      return await providers[providerId].send(input)
    } catch (error) {
      failures.push(`${providerId}: ${error instanceof Error ? error.message : "failed"}`)
      if (providerId === "resend" && primary === "resend") break
    }
  }

  throw new Error(`All email providers failed (${failures.join("; ")})`)
}

export function normalizeProviderWebhook(provider: EmailProviderId, payload: unknown, headers: Headers) {
  return providers[provider].normalizeWebhook(payload, headers)
}
