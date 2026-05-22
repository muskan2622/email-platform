import type { SupabaseClient } from "@supabase/supabase-js"
import { parseConditionGroup } from "@/lib/engine/conditions"
import type { ConditionGroup, ConditionRule } from "@/lib/types/database"
import type { AutomationWizardFormValues } from "@/lib/validators/automation-wizard"
import { humanizeRule } from "@/lib/automation/humanize-conditions"

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `automation-${Date.now()}`
}

function isGroup(rule: ConditionRule | ConditionGroup): rule is ConditionGroup {
  return "operator" in rule && Array.isArray(rule.rules)
}

async function syncNormalizedConditions(
  supabase: SupabaseClient,
  automationId: string,
  group: ConditionGroup,
  parentGroupId: string | null = null,
  sortBase = 0
) {
  const { data: groupRow, error: groupError } = await supabase
    .from("automation_condition_groups")
    .insert({
      automation_id: automationId,
      parent_group_id: parentGroupId,
      operator: group.operator,
      sort_order: sortBase,
    })
    .select("id")
    .single()

  if (groupError) throw new Error(groupError.message)

  let sort = 0
  for (const rule of group.rules) {
    if (isGroup(rule)) {
      await syncNormalizedConditions(supabase, automationId, rule, groupRow.id, sort++)
    } else {
      const { error } = await supabase.from("automation_conditions").insert({
        group_id: groupRow.id,
        field_path: rule.field,
        operator: rule.op,
        value: rule.value ?? null,
        human_label: humanizeRule(rule),
        sort_order: sort++,
      })
      if (error) throw new Error(error.message)
    }
  }
}

export async function persistAutomation(
  supabase: SupabaseClient,
  values: AutomationWizardFormValues & { id?: string },
  options?: { activate?: boolean }
) {
  const conditions = parseConditionGroup(values.conditions)
  const status = options?.activate ? "active" : values.status
  const name =
    values.name.trim() ||
    `Automation — ${values.trigger_event}`
  const slug = slugify(name)

  const row = {
    name,
    description: values.description?.trim() || null,
    status,
    trigger_event: values.trigger_event,
    conditions,
    template_id: values.template_id || null,
    delivery_rules: values.delivery_rules,
    activated_at: options?.activate ? new Date().toISOString() : null,
    metadata: { source: "wizard" },
  }

  let automationId: string | undefined = values.id

  if (automationId) {
    const { error } = await supabase
      .from("automations")
      .update(row)
      .eq("id", automationId)
    if (error) throw new Error(error.message)
  } else {
    const { data, error } = await supabase
      .from("automations")
      .insert({ ...row, slug: `${slug}-${Date.now().toString(36)}` })
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    automationId = data.id as string
  }

  if (!automationId) throw new Error("Failed to resolve automation id")

  await supabase.from("automation_condition_groups").delete().eq("automation_id", automationId)
  await supabase.from("automation_actions").delete().eq("automation_id", automationId)

  if (conditions.rules.length > 0) {
    await syncNormalizedConditions(supabase, automationId, conditions)
  }

  await supabase.from("automation_actions").insert({
    automation_id: automationId,
    action_type: "send_email",
    template_id: values.template_id,
    config: values.delivery_rules,
    sort_order: 0,
  })

  if (values.template_id) {
    const sendOnce = values.delivery_rules.mode === "once_per_user"
    const triggerPayload = {
      name,
      description: values.description?.trim() || null,
      event_type: values.trigger_event,
      template_id: values.template_id,
      conditions,
      enabled: status === "active",
      priority: 50,
      send_once_per_user: sendOnce,
      send_once_key: sendOnce ? `automation:${automationId}` : null,
    }

    const { data: existing } = await supabase
      .from("automations")
      .select("trigger_id")
      .eq("id", automationId)
      .single()

    const triggerId = existing?.trigger_id as string | null

    if (triggerId) {
      await supabase.from("triggers").update(triggerPayload).eq("id", triggerId)
    } else {
      const { data: newTrigger, error: insertTriggerError } = await supabase
        .from("triggers")
        .insert(triggerPayload)
        .select("id")
        .single()

      if (!insertTriggerError && newTrigger?.id) {
        await supabase
          .from("automations")
          .update({ trigger_id: newTrigger.id })
          .eq("id", automationId)
      }
    }
  }

  const { data: automation, error: fetchError } = await supabase
    .from("automations")
    .select("*, templates(id, name, slug, subject, status)")
    .eq("id", automationId)
    .single()

  if (fetchError) throw new Error(fetchError.message)
  return automation
}
