import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { evaluateConditions, parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const trigger_event =
    typeof body.trigger_event === "string" ? body.trigger_event : ""
  const conditions = parseConditionGroup(body.conditions)

  const supabase = createAdminClient()

  const { data: users, error: usersError } = await supabase
    .from("end_users")
    .select("*")
    .limit(500)

  if (usersError) return jsonError(usersError.message, 500)

  const { count: eventCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("type", trigger_event || "___none___")

  let matched = 0
  for (const user of users ?? []) {
    const ok = evaluateConditions(conditions, {
      payload: {},
      user: user as Parameters<typeof evaluateConditions>[1]["user"],
    })
    if (ok) matched++
  }

  const totalUsers = users?.length ?? 0
  const pct = totalUsers > 0 ? Math.round((matched / totalUsers) * 100) : 0

  const estimate = Math.max(
    matched,
    Math.round((eventCount ?? 0) * (pct / 100) * 0.4)
  )

  return jsonOk({
    estimate,
    matched_users: matched,
    total_users_sampled: totalUsers,
    recent_events: eventCount ?? 0,
    confidence: totalUsers >= 50 ? "high" : totalUsers >= 10 ? "medium" : "low",
  })
}
