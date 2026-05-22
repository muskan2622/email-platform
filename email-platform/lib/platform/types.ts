import type { EventRecord, Template, Trigger } from "@/lib/types/database"

export type SendLogRow = {
  id: string
  status: string
  rendered_subject: string | null
  skip_reason: string | null
  error: string | null
  created_at: string
  triggers: { name: string } | null
  templates: { slug: string; name: string } | null
  end_users: { email: string; external_id: string } | null
}

export type TriggerWithTemplate = Trigger & {
  templates: { id: string; slug: string; name: string; status: string } | null
}

export type PlatformStats = {
  templates: Template[]
  triggers: TriggerWithTemplate[]
  events: EventRecord[]
  sendLog: SendLogRow[]
  sentCount: number
  failedCount: number
  skippedCount: number
  sentToday: number
  eventsCount: number
  activeTriggers: number
}
