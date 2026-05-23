import { resolveIcon } from "@/lib/automation/icon-map"
import type { FieldDefinition } from "@/lib/automation/field-definitions"
import type { TriggerCategory, TriggerDefinition } from "@/lib/automation/trigger-catalog"
import type { ConditionOperator } from "@/lib/types/database"
import type {
  ConditionFieldRow,
  EventTypeCategoryRow,
  EventTypeRow,
} from "@/lib/platform/types"

export function resolveTriggerCategories(
  rows: EventTypeCategoryRow[]
): Record<TriggerCategory, string> {
  const map = {} as Record<TriggerCategory, string>
  for (const row of rows) {
    map[row.id as TriggerCategory] = row.label
  }
  return map
}

export function resolveEventTypes(rows: EventTypeRow[]): TriggerDefinition[] {
  return rows
    .filter((r) => r.enabled)
    .map((r) => ({
      id: r.id,
      event: r.event,
      label: r.label,
      description: r.description,
      category: r.category_id as TriggerCategory,
      icon: resolveIcon(r.icon),
      realtime: r.realtime,
      samplePayload: r.sample_payload ?? undefined,
    }))
}

export function resolveConditionFields(rows: ConditionFieldRow[]): FieldDefinition[] {
  return rows
    .filter((r) => r.enabled)
    .map((r) => ({
      field: r.field,
      label: r.label,
      description: r.description ?? undefined,
      valueType: r.value_type,
      operators: r.operators as ConditionOperator[],
      options: r.options ?? undefined,
    }))
}

export function findTriggerInCatalog(
  event: string,
  catalog: TriggerDefinition[]
): TriggerDefinition | undefined {
  return catalog.find((t) => t.event === event)
}

export function getFieldDefinitionFromCatalog(
  field: string,
  fields: FieldDefinition[]
): FieldDefinition | undefined {
  return fields.find((f) => f.field === field)
}
