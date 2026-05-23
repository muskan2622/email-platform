import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { createAdminClient } from "@/lib/supabase/admin"

type Params = { params: Promise<{ id: string }> }

const PATCHABLE = [
  "name",
  "slug",
  "subject",
  "body_html",
  "body_text",
  "status",
] as const

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) return jsonError(error.message, 500)
  if (!data) return jsonError("Template not found", 404)
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
  for (const key of PATCHABLE) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No valid fields to update")
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return jsonError(error.message, 400)
  return jsonOk(data)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from("templates").delete().eq("id", id)
  if (error) return jsonError(error.message, 400)
  return jsonOk({ deleted: true })
}
