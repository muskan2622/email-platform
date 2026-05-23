import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { logTemplateTestSend } from "@/lib/email/log-template-test"
import {
  buildRenderContext,
  renderEmail,
  TemplateRenderError,
} from "@/lib/email/render"
import { sendEmail, type EmailProviderId } from "@/lib/email/send"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Template } from "@/lib/types/database"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const to = typeof body.to === "string" ? body.to.trim() : ""
  if (!to) return jsonError("to (email address) is required")
  const provider =
    body.provider === "sendgrid" || body.provider === "ses" || body.provider === "resend"
      ? (body.provider as EmailProviderId)
      : "resend"

  const supabase = createAdminClient()
  const { data: template, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) return jsonError(error.message, 500)
  if (!template) return jsonError("Template not found", 404)

  const payload =
    body.payload && typeof body.payload === "object"
      ? (body.payload as Record<string, unknown>)
      : {}

  const context = buildRenderContext(payload)
  let rendered: ReturnType<typeof renderEmail>
  try {
    rendered = renderEmail(
      (template as Template).subject,
      (template as Template).body_html,
      (template as Template).body_text,
      context
    )
  } catch (err) {
    const message =
      err instanceof TemplateRenderError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Template render failed"
    return jsonError(message, 400)
  }

  const renderedSubject = `[TEST] ${rendered.subject}`

  try {
    const sent = await sendEmail({
      to,
      subject: renderedSubject,
      html: rendered.html,
      text: rendered.text,
      provider,
      idempotencyKey: `test:${id}:${to}`,
    })

    let logged: { event_id: string; send_log_id: string } | null = null
    try {
      logged = await logTemplateTestSend({
        templateId: id,
        to,
        provider: sent.provider,
        renderedSubject,
        providerMessageId: sent.id,
        status: "sent",
      })
    } catch {
      // Email delivered; logging failure should not block the test response.
    }

    return jsonOk({
      message_id: sent.id,
      provider: sent.provider,
      status: sent.status,
      rendered,
      event_id: logged?.event_id,
      send_log_id: logged?.send_log_id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed"

    try {
      await logTemplateTestSend({
        templateId: id,
        to,
        provider,
        renderedSubject,
        status: "failed",
        error: message,
      })
    } catch {
      // Provider failed; still return the send error to the client.
    }

    return jsonError(message, 502)
  }
}
