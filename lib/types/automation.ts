import type { ConditionGroup } from "@/lib/types/database"

export type AutomationStatus = "draft" | "active" | "paused" | "archived"

export type DeliveryMode = "every_trigger" | "once_per_user" | "cooldown"

export interface DeliveryRules {
  mode: DeliveryMode
  delay_minutes: number
  cooldown_days: number
  max_sends_per_user: number | null
  send_immediately: boolean
}

export interface Automation {
  id: string
  name: string
  slug: string
  description: string | null
  status: AutomationStatus
  trigger_event: string
  conditions: ConditionGroup
  template_id: string | null
  delivery_rules: DeliveryRules
  trigger_id: string | null
  audience_estimate: number | null
  metadata: Record<string, unknown>
  activated_at: string | null
  created_at: string
  updated_at: string
}

export interface AutomationAction {
  id: string
  automation_id: string
  action_type: "send_email" | "webhook" | "delay"
  template_id: string | null
  config: Record<string, unknown>
  sort_order: number
  created_at: string
}

export interface AutomationRun {
  id: string
  automation_id: string
  event_id: string | null
  user_external_id: string | null
  status: string
  skip_reason: string | null
  started_at: string
  completed_at: string | null
}

export const DEFAULT_DELIVERY_RULES: DeliveryRules = {
  mode: "once_per_user",
  delay_minutes: 0,
  cooldown_days: 0,
  max_sends_per_user: 1,
  send_immediately: true,
}
