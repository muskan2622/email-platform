"use client"

import { useCallback, useEffect, useState } from "react"
import { apiGet } from "@/lib/api/client"
import type { EventRecord, Template, Trigger } from "@/lib/types/database"
import { isToday } from "@/lib/utils/time"

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

export interface PlatformStats {
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

export function usePlatformData() {
  const [data, setData] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [templates, triggers, events, sendLog] = await Promise.all([
        apiGet<Template[]>("/api/templates"),
        apiGet<TriggerWithTemplate[]>("/api/triggers"),
        apiGet<EventRecord[]>("/api/events?limit=50"),
        apiGet<SendLogRow[]>("/api/send-log?limit=100"),
      ])

      const sentCount = sendLog.filter((r) => r.status === "sent").length
      const failedCount = sendLog.filter((r) => r.status === "failed").length
      const skippedCount = sendLog.filter((r) => r.status === "skipped").length
      const sentToday = sendLog.filter(
        (r) => r.status === "sent" && isToday(r.created_at)
      ).length

      setData({
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
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void refresh()
    })
  }, [refresh])

  return { data, loading, error, refresh }
}
