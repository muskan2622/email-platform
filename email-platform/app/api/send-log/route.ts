import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit") ?? "50"),
    100
  )
  const status = request.nextUrl.searchParams.get("status")

  let query = supabase
    .from("send_log")
    .select(
      "*, triggers(name), templates(slug, name), end_users(email, external_id)"
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return jsonOk(data)
}
