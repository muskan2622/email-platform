import { NextRequest } from "next/server"
import { runAiAssist, type AiAssistAction } from "@/lib/ai/assist"
import { jsonError, jsonOk } from "@/lib/api/response"

const ACTIONS: AiAssistAction[] = [
  "draft",
  "rewrite_tone",
  "subject_lines",
  "improve",
]

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const action = body.action as AiAssistAction
  if (!ACTIONS.includes(action)) {
    return jsonError(`action must be one of: ${ACTIONS.join(", ")}`)
  }

  try {
    const result = await runAiAssist({
      action,
      subject: typeof body.subject === "string" ? body.subject : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      tone: typeof body.tone === "string" ? body.tone : undefined,
      context: typeof body.context === "string" ? body.context : undefined,
      platform_context:
        typeof body.platform_context === "string" ? body.platform_context : undefined,
    })
    return jsonOk(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed"
    return jsonError(message, 502)
  }
}
