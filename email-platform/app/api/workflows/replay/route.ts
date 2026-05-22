import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { evaluateConditions, parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseIncomingEvent } from "@/lib/validators/events"

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const event = parseIncomingEvent(body)
  if (!event) return jsonError("Invalid event: require type (string)")

  const supabase = createAdminClient()
  const { data: triggers, error } = await supabase
    .from("triggers")
    .select("id, name, event_type, conditions, enabled, templates(id, name, status)")
    .eq("event_type", event.type)
    .order("priority", { ascending: true })

  if (error) return jsonError(error.message, 500)

  const user = event.user
    ? {
        id: "preview",
        external_id: event.user.external_id,
        email: event.user.email,
        metadata: event.user.metadata ?? {},
        unsubscribed_product: event.user.unsubscribed_product ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null

  const evaluations = (triggers ?? []).map((trigger) => {
    const conditions = parseConditionGroup(trigger.conditions)
    const matched = trigger.enabled && evaluateConditions(conditions, {
      payload: event.payload ?? {},
      user,
      aggregates: {
        emails_sent_last_7_days: 2,
        messages_sent_last_30_days: 14,
        invoices_paid_lifetime: 3,
      },
      activity: {
        last_login_at: new Date().toISOString(),
        projects_created: 5,
      },
    })

    return {
      trigger_id: trigger.id,
      trigger_name: trigger.name,
      event_type: trigger.event_type,
      matched,
      reason: matched ? "conditions_passed" : "conditions_failed_or_disabled",
      template: trigger.templates,
    }
  })

  return jsonOk({
    replay_id: crypto.randomUUID(),
    accepted_at: new Date().toISOString(),
    idempotency_key: `${event.source ?? "api"}:${event.message_id ?? crypto.randomUUID()}`,
    evaluations,
  })
}
