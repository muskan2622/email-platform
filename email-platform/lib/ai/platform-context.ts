import type { PlatformStats } from "@/lib/hooks/use-platform-data"

export function buildPlatformContextSummary(data: PlatformStats | null): string {
  if (!data) return "Platform data not loaded."

  const recentSends = data.sendLog.slice(0, 5).map((r) => ({
    status: r.status,
    subject: r.rendered_subject,
    trigger: r.triggers?.name,
    user: r.end_users?.email,
    at: r.created_at,
  }))

  const recentEvents = data.events.slice(0, 5).map((e) => ({
    type: e.type,
    processed: Boolean(e.processed_at),
    at: e.created_at,
  }))

  const topTemplates = data.templates.slice(0, 5).map((t) => ({
    name: t.name,
    status: t.status,
    subject: t.subject,
  }))

  return JSON.stringify(
    {
      metrics: {
        sent_total: data.sentCount,
        sent_today: data.sentToday,
        failed: data.failedCount,
        skipped: data.skippedCount,
        events_loaded: data.eventsCount,
        active_triggers: data.activeTriggers,
        templates: data.templates.length,
      },
      recent_sends: recentSends,
      recent_events: recentEvents,
      templates: topTemplates,
      triggers: data.triggers.slice(0, 8).map((t) => ({
        name: t.name,
        event_type: t.event_type,
        enabled: t.enabled,
        template: t.templates?.name,
      })),
    },
    null,
    0
  )
}
