import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("triggers")
    .select("*, templates(*)")
    .eq("id", id)
    .maybeSingle()

  if (error) return jsonError(error.message, 500)
  if (!data) return jsonError("Trigger not found", 404)
  return jsonOk(data)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const updates: Record<string, unknown> = {}
  const fields = [
    "name",
    "description",
    "event_type",
    "template_id",
    "enabled",
    "priority",
    "send_once_per_user",
    "send_once_key",
  ] as const

  for (const key of fields) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (body.conditions !== undefined) {
    updates.conditions = parseConditionGroup(body.conditions)
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No valid fields to update")
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("triggers")
    .update(updates)
    .eq("id", id)
    .select("*, templates(id, slug, name, status)")
    .single()

  if (error) return jsonError(error.message, 400)
  return jsonOk(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from("triggers").delete().eq("id", id)
  if (error) return jsonError(error.message, 400)
  return jsonOk({ deleted: true })
}
