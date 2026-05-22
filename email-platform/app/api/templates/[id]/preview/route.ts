import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { buildRenderContext, renderEmail } from "@/lib/email/render"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Template } from "@/lib/types/database"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: template, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) return jsonError(error.message, 500)
  if (!template) return jsonError("Template not found", 404)

  let payload: Record<string, unknown> = {}
  try {
    const body = await request.json()
    if (body?.payload && typeof body.payload === "object") {
      payload = body.payload as Record<string, unknown>
    }
  } catch {
    // empty body is fine — preview with defaults
  }

  const context = buildRenderContext(payload)
  const rendered = renderEmail(
    (template as Template).subject,
    (template as Template).body_html,
    (template as Template).body_text,
    context
  )

  return jsonOk({ context, ...rendered })
}
