import { NextRequest } from "next/server"
import { assertEventsApiKey } from "@/lib/api/auth"
import { jsonError, jsonOk } from "@/lib/api/response"
import { processEvent } from "@/lib/engine/process-event"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseIncomingEvent } from "@/lib/validators/events"

export async function POST(request: NextRequest) {
  if (!assertEventsApiKey(request)) {
    return jsonError("Unauthorized", 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const event = parseIncomingEvent(body)
  if (!event) {
    return jsonError("Invalid event: require type (string)")
  }

  try {
    const outcome = await processEvent(event)
    return jsonOk(outcome, 202)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed"
    return jsonError(message, 500)
  }
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "50"),
    100
  )

  const { data, error } = await supabase
    .from("events")
    .select("id, type, payload, user_external_id, processed_at, processing_result, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return jsonError(error.message, 500)
  return jsonOk(data)
}
