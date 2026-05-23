import type { ConditionOperator, EventRecord, Template, Trigger } from "@/lib/types/database"
import type { FieldValueType } from "@/lib/automation/field-definitions"
import type { TriggerCategory } from "@/lib/automation/trigger-catalog"

export type EventTypeCategoryRow = {
  id: TriggerCategory
  label: string
  sort_order: number
}

export type EventTypeRow = {
  id: string
  event: string
  label: string
  description: string
  category_id: TriggerCategory
  icon: string
  realtime: boolean
  sample_payload: Record<string, unknown> | null
  enabled: boolean
  sort_order: number
}

export type ConditionFieldRow = {
  id: string
  field: string
  label: string
  description: string | null
  value_type: FieldValueType
  operators: ConditionOperator[]
  options: { value: string; label: string }[] | null
  enabled: boolean
  sort_order: number
}

export type SendLogRow = {
  id: string
  status: string
  rendered_subject: string | null
  skip_reason: string | null
  error: string | null
  created_at: string
  trigger_id: string | null
  triggers: { name: string } | null
  templates: { slug: string; name: string } | null
  end_users: { email: string; external_id: string } | null
}

export type TriggerWithTemplate = Trigger & {
  templates: { id: string; slug: string; name: string; status: string } | null
}

export type AutomationWithTemplate = {
  id: string
  name: string
  slug: string
  description: string | null
  status: string
  trigger_event: string
  conditions: unknown
  template_id: string | null
  delivery_rules: Record<string, unknown>
  trigger_id: string | null
  audience_estimate: number | null
  activated_at: string | null
  created_at: string
  updated_at: string
  templates: { id: string; name: string; slug: string; status: string } | null
}

export type PlatformStats = {
  templates: Template[]
  triggers: TriggerWithTemplate[]
  automations: AutomationWithTemplate[]
  events: EventRecord[]
  sendLog: SendLogRow[]
  eventTypeCategories: EventTypeCategoryRow[]
  eventTypes: EventTypeRow[]
  conditionFields: ConditionFieldRow[]
  sentCount: number
  failedCount: number
  skippedCount: number
  sentToday: number
  eventsCount: number
  activeTriggers: number
}
