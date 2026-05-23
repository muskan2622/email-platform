import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const eventType = request.nextUrl.searchParams.get("event_type")

  let query = supabase
    .from("triggers")
    .select("*, templates(id, slug, name, status)")
    .order("priority", { ascending: true })

  if (eventType) query = query.eq("event_type", eventType)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return jsonOk(data)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  const event_type =
    typeof body.event_type === "string" ? body.event_type.trim() : ""
  const template_id =
    typeof body.template_id === "string" ? body.template_id : ""

  if (!name || !event_type || !template_id) {
    return jsonError("name, event_type, and template_id are required")
  }

  const conditions = parseConditionGroup(body.conditions)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("triggers")
    .insert({
      name,
      description:
        typeof body.description === "string" ? body.description : null,
      event_type,
      template_id,
      conditions,
      enabled: body.enabled !== false,
      priority: typeof body.priority === "number" ? body.priority : 100,
      send_once_per_user: body.send_once_per_user === true,
      send_once_key:
        typeof body.send_once_key === "string" ? body.send_once_key : null,
    })
    .select("*, templates(id, slug, name, status)")
    .single()

  if (error) return jsonError(error.message, 400)
  return jsonOk(data, 201)
}
