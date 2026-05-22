import type { SupabaseClient } from "@supabase/supabase-js"
import type { EventRecord, Template } from "@/lib/types/database"
import type {
  PlatformStats,
  SendLogRow,
  TriggerWithTemplate,
} from "@/lib/platform/types"
import { isToday } from "@/lib/utils/time"

export type PlatformSnapshotOptions = {
  eventsLimit?: number
  sendLogLimit?: number
}

export type PlatformSnapshot = PlatformStats

const TEMPLATE_COLUMNS =
  "id,slug,name,subject,body_html,body_text,status,created_at,updated_at"

const SEND_LOG_COLUMNS =
  "id,status,rendered_subject,skip_reason,error,created_at,trigger_id,template_id,end_user_id,triggers(name),templates(slug,name),end_users(email,external_id)"

export async function fetchPlatformSnapshot(
  supabase: SupabaseClient,
  options: PlatformSnapshotOptions = {}
): Promise<PlatformSnapshot> {
  const eventsLimit = Math.min(options.eventsLimit ?? 50, 100)
  const sendLogLimit = Math.min(options.sendLogLimit ?? 100, 100)

  const [templatesRes, triggersRes, eventsRes, sendLogRes] = await Promise.all([
    supabase
      .from("templates")
      .select(TEMPLATE_COLUMNS)
      .order("updated_at", { ascending: false }),
    supabase
      .from("triggers")
      .select("*, templates(id, slug, name, status)")
      .order("priority", { ascending: true }),
    supabase
      .from("events")
      .select(
        "id, type, payload, user_external_id, processed_at, processing_result, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(eventsLimit),
    supabase
      .from("send_log")
      .select(SEND_LOG_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(sendLogLimit),
  ])

  const firstError =
    templatesRes.error ??
    triggersRes.error ??
    eventsRes.error ??
    sendLogRes.error
  if (firstError) throw new Error(firstError.message)

  const templates = (templatesRes.data ?? []) as Template[]
  const triggers = (triggersRes.data ?? []) as TriggerWithTemplate[]
  const events = (eventsRes.data ?? []) as EventRecord[]
  const sendLog = (sendLogRes.data ?? []) as unknown as SendLogRow[]

  const sentCount = sendLog.filter((r) => r.status === "sent").length
  const failedCount = sendLog.filter((r) => r.status === "failed").length
  const skippedCount = sendLog.filter((r) => r.status === "skipped").length
  const sentToday = sendLog.filter(
    (r) => r.status === "sent" && isToday(r.created_at)
  ).length

  return {
    templates,
    triggers,
    events,
    sendLog,
    sentCount,
    failedCount,
    skippedCount,
    sentToday,
    eventsCount: events.length,
    activeTriggers: triggers.filter((t) => t.enabled).length,
  }
}
