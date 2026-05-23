import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseIncomingEvent } from "@/lib/validators/events"
import {
  automationToWorkflowSource,
  triggerToWorkflowSource,
} from "@/lib/workflow/build-graph"
import { executeWorkflow } from "@/lib/workflow/execute-workflow"
import { DEFAULT_DELIVERY_RULES } from "@/lib/types/automation"
import type { DeliveryRules } from "@/lib/types/automation"

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const eventPayload = body.event ?? body
  const event = parseIncomingEvent(eventPayload)
  if (!event) return jsonError("Invalid event: require type (string)")

  const automationId =
    typeof body.automation_id === "string" ? body.automation_id : undefined
  const triggerId = typeof body.trigger_id === "string" ? body.trigger_id : undefined
  const testMode = body.test_mode !== false

  const supabase = createAdminClient()

  if (automationId) {
    const { data: automation, error } = await supabase
      .from("automations")
      .select("*, templates(id, name, status)")
      .eq("id", automationId)
      .single()

    if (error || !automation) {
      return jsonError(error?.message ?? "Automation not found", 404)
    }

    let trigger: { enabled: boolean; send_once_per_user: boolean } | null = null
    if (automation.trigger_id) {
      const { data: trg } = await supabase
        .from("triggers")
        .select("enabled, send_once_per_user")
        .eq("id", automation.trigger_id)
        .single()
      trigger = trg
    }

    const delivery =
      automation.delivery_rules && typeof automation.delivery_rules === "object"
        ? (automation.delivery_rules as DeliveryRules)
        : DEFAULT_DELIVERY_RULES

    const source = automationToWorkflowSource(
      {
        ...automation,
        conditions: parseConditionGroup(automation.conditions),
        delivery_rules: delivery,
      },
      trigger
    )

    const result = executeWorkflow(source, event, { test_mode: testMode })
    return jsonOk(result)
  }

  if (triggerId) {
    const { data: trigger, error } = await supabase
      .from("triggers")
      .select("*, templates(id, name, status)")
      .eq("id", triggerId)
      .single()

    if (error || !trigger) {
      return jsonError(error?.message ?? "Trigger not found", 404)
    }

    const source = triggerToWorkflowSource({
      ...trigger,
      conditions: parseConditionGroup(trigger.conditions),
      templates: trigger.templates,
    })

    const result = executeWorkflow(source, event, { test_mode: testMode })
    return jsonOk(result)
  }

  return jsonError("automation_id or trigger_id is required", 400)
}
