import { jsonError, jsonOk } from "@/lib/api/response"
import { fetchPlatformSnapshot } from "@/lib/platform/queries"
import { createAdminClient } from "@/lib/supabase/admin"

/** Live platform snapshot for Pulse AI (same tables as dashboard). */
export async function GET() {
  try {
    const supabase = createAdminClient()
    const snapshot = await fetchPlatformSnapshot(supabase, {
      eventsLimit: 20,
      sendLogLimit: 30,
    })

    return jsonOk({
      refreshed_at: new Date().toISOString(),
      metrics: {
        sent_total: snapshot.sentCount,
        sent_today: snapshot.sentToday,
        failed: snapshot.failedCount,
        skipped: snapshot.skippedCount,
        events: snapshot.eventsCount,
        templates: snapshot.templates.length,
        active_triggers: snapshot.activeTriggers,
      },
      templates: snapshot.templates,
      triggers: snapshot.triggers,
      events: snapshot.events,
      send_log: snapshot.sendLog,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load AI context"
    return jsonError(message, 502)
  }
}
