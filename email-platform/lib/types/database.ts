export type TemplateStatus = "draft" | "active" | "archived"
export type SendLogStatus = "sent" | "failed" | "skipped"

export type ConditionOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "not_in"
  | "exists"
  | "not_exists"

export interface ConditionRule {
  field: string
  op: ConditionOperator
  value?: unknown
}

export interface ConditionGroup {
  operator: "and" | "or"
  rules: ConditionRule[]
}

export interface Template {
  id: string
  slug: string
  name: string
  subject: string
  body_html: string
  body_text: string | null
  status: TemplateStatus
  created_at: string
  updated_at: string
}

export interface Trigger {
  id: string
  name: string
  description: string | null
  event_type: string
  template_id: string
  conditions: ConditionGroup
  enabled: boolean
  priority: number
  send_once_per_user: boolean
  send_once_key: string | null
  created_at: string
  updated_at: string
}

export interface EndUser {
  id: string
  external_id: string
  email: string
  metadata: Record<string, unknown>
  unsubscribed_product: boolean
  created_at: string
  updated_at: string
}

export interface EventRecord {
  id: string
  type: string
  payload: Record<string, unknown>
  user_external_id: string | null
  processed_at: string | null
  processing_result: ProcessingResult | null
  created_at: string
}

export interface SendLogEntry {
  id: string
  event_id: string | null
  trigger_id: string | null
  template_id: string | null
  end_user_id: string | null
  status: SendLogStatus
  skip_reason: string | null
  provider_message_id: string | null
  rendered_subject: string | null
  error: string | null
  created_at: string
}

export interface IncomingEvent {
  type: string
  payload?: Record<string, unknown>
  user?: {
    external_id: string
    email: string
    metadata?: Record<string, unknown>
    unsubscribed_product?: boolean
  }
}

export interface TriggerEvaluation {
  trigger_id: string
  trigger_name: string
  template_id: string
  status: SendLogStatus
  skip_reason?: string
  provider_message_id?: string
  error?: string
}

export interface ProcessingResult {
  matched_triggers: number
  evaluations: TriggerEvaluation[]
}

export interface RenderContext {
  [key: string]: unknown
}
