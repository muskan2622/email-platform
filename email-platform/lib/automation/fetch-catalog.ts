import type { SupabaseClient } from "@supabase/supabase-js"
import {
  resolveConditionFields,
  resolveEventTypes,
  resolveTriggerCategories,
} from "@/lib/automation/resolve-catalog"

export async function fetchAutomationCatalog(supabase: SupabaseClient) {
  const [categoriesRes, eventTypesRes, conditionFieldsRes] = await Promise.all([
    supabase
      .from("event_type_categories")
      .select("id, label, sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("event_types")
      .select(
        "id, event, label, description, category_id, icon, realtime, sample_payload, enabled, sort_order"
      )
      .eq("enabled", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("condition_field_definitions")
      .select("id, field, label, description, value_type, operators, options, enabled, sort_order")
      .eq("enabled", true)
      .order("sort_order", { ascending: true }),
  ])

  const error =
    categoriesRes.error ?? eventTypesRes.error ?? conditionFieldsRes.error
  if (error) throw new Error(error.message)

  const conditionFields = resolveConditionFields(conditionFieldsRes.data ?? [])

  return {
    categories: resolveTriggerCategories(categoriesRes.data ?? []),
    eventTypes: resolveEventTypes(eventTypesRes.data ?? []),
    conditionFields,
  }
}
