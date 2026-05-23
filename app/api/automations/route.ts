import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { persistAutomation } from "@/lib/automation/persist-automation"
import { parseConditionGroup } from "@/lib/engine/conditions"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  automationDraftSchema,
  automationWizardSchema,
  defaultWizardValues,
} from "@/lib/validators/automation-wizard"

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const status = request.nextUrl.searchParams.get("status")
  const q = request.nextUrl.searchParams.get("q")?.trim()

  let query = supabase
    .from("automations")
    .select("*, templates(id, name, slug, subject, status)")
    .order("updated_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)

  const { data, error } = await query
  if (error) {
    if (error.message.includes("does not exist")) {
      return jsonOk([])
    }
    return jsonError(error.message, 500)
  }
  return jsonOk(data)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const activate = body.activate === true
  const draft = body.draft === true

  const schema = draft ? automationDraftSchema : automationWizardSchema
  const parsed = schema.safeParse({
    ...defaultWizardValues(),
    ...body,
    conditions: parseConditionGroup(body.conditions ?? defaultWizardValues().conditions),
    status: draft ? "draft" : activate ? "active" : body.status ?? "draft",
  })

  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join("; "), 400)
  }

  if (activate) {
    const required = ["trigger_event", "template_id"] as const
    for (const key of required) {
      if (!parsed.data[key]) {
        return jsonError(`${key} is required to activate`)
      }
    }
  }

  try {
    const supabase = createAdminClient()
    const automation = await persistAutomation(
      supabase,
      {
        ...parsed.data,
        name:
          parsed.data.name?.trim() ||
          (typeof body.name === "string" ? body.name : "") ||
          `Draft — ${parsed.data.trigger_event}`,
        template_id: parsed.data.template_id ?? "",
        id: typeof body.id === "string" ? body.id : undefined,
      },
      { activate }
    )

    return jsonOk(automation, activate ? 201 : 200)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save automation"
    if (
      message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("Could not find the table")
    ) {
      return jsonError(
        "Automations tables not found. Run supabase/migrations/20250524000003_ensure_automation_builder.sql in the Supabase SQL editor.",
        503
      )
    }
    return jsonError(message, 500)
  }
}
