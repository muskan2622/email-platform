import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { buildRenderContext, renderEmail } from "@/lib/email/render"
import { sendEmail } from "@/lib/email/send"
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
  const rendered = renderEmail(
    (template as Template).subject,
    (template as Template).body_html,
    (template as Template).body_text,
    context
  )

  try {
    const sent = await sendEmail({
      to,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    })
    return jsonOk({ message_id: sent?.id, rendered })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed"
    return jsonError(message, 502)
  }
}
