import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { normalizeProviderWebhook, type EmailProviderId } from "@/lib/email/send"
import { createAdminClient } from "@/lib/supabase/admin"

type Params = { params: Promise<{ provider: string }> }

function isProvider(provider: string): provider is EmailProviderId {
  return provider === "resend" || provider === "sendgrid" || provider === "ses"
}

export async function POST(request: NextRequest, { params }: Params) {
  const { provider } = await params
  if (!isProvider(provider)) return jsonError("Unsupported email provider", 404)

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const events = normalizeProviderWebhook(provider, payload, request.headers)
  const supabase = createAdminClient()

  const rows = events.map((event) => ({
    provider: event.provider,
    provider_message_id: event.providerMessageId,
    event_type: event.type,
    recipient: event.recipient ?? null,
    template_id: event.templateId ?? null,
    payload: event.metadata,
    occurred_at: event.occurredAt,
  }))

  const { error } = await supabase.from("email_webhook_events").insert(rows)
  if (error) return jsonError(error.message, 500)

  return jsonOk({ accepted: rows.length }, 202)
}
