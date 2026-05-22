import { createAdminClient } from "@/lib/supabase/admin"
import { jsonError, jsonOk } from "@/lib/api/response"
import { isToday } from "@/lib/utils/time"

/** Live platform snapshot for Pulse AI (same tables as dashboard). */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const [templatesRes, triggersRes, eventsRes, sendLogRes] = await Promise.all([
      supabase.from("templates").select("id,name,subject,status,updated_at").order("updated_at", { ascending: false }).limit(20),
      supabase.from("triggers").select("id,name,event_type,enabled,templates(name)").order("priority", { ascending: true }),
      supabase.from("events").select("id,type,created_at,processed_at").order("created_at", { ascending: false }).limit(20),
      supabase
        .from("send_log")
        .select("id,status,rendered_subject,created_at,triggers(name),end_users(email)")
        .order("created_at", { ascending: false })
        .limit(30),
    ])

    if (templatesRes.error) return jsonError(templatesRes.error.message, 500)
    if (triggersRes.error) return jsonError(triggersRes.error.message, 500)
    if (eventsRes.error) return jsonError(eventsRes.error.message, 500)
    if (sendLogRes.error) return jsonError(sendLogRes.error.message, 500)

    const sendLog = sendLogRes.data ?? []
    const sentCount = sendLog.filter((r) => r.status === "sent").length
    const failedCount = sendLog.filter((r) => r.status === "failed").length
    const skippedCount = sendLog.filter((r) => r.status === "skipped").length
    const sentToday = sendLog.filter(
      (r) => r.status === "sent" && isToday(r.created_at)
    ).length

    return jsonOk({
      refreshed_at: new Date().toISOString(),
      metrics: {
        sent_total: sentCount,
        sent_today: sentToday,
        failed: failedCount,
        skipped: skippedCount,
        events: (eventsRes.data ?? []).length,
        templates: (templatesRes.data ?? []).length,
        active_triggers: (triggersRes.data ?? []).filter((t) => t.enabled).length,
      },
      templates: templatesRes.data,
      triggers: triggersRes.data,
      events: eventsRes.data,
      send_log: sendLog,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load AI context"
    return jsonError(message, 502)
  }
}
