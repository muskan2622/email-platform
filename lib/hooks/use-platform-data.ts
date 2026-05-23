"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { apiGet } from "@/lib/api/client"
import type { PlatformStats } from "@/lib/platform/types"

export type { PlatformStats, SendLogRow, TriggerWithTemplate } from "@/lib/platform/types"

export function usePlatformData(options?: { pollMs?: number; enabled?: boolean }) {
  const pollMs = options?.pollMs ?? 0
  const enabled = options?.enabled ?? true
  const [data, setData] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<number | null>(null)
  const hasLoadedRef = useRef(false)

  const refresh = useCallback(async () => {
    setError(null)
    if (!hasLoadedRef.current) setLoading(true)
    try {
      const snapshot = await apiGet<PlatformStats>(
        "/api/platform?events_limit=50&send_log_limit=100"
      )
      setData(snapshot)
      hasLoadedRef.current = true
      setLastRefreshed(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    queueMicrotask(() => {
      void refresh()
    })
  }, [refresh, enabled])

  useEffect(() => {
    if (!enabled || pollMs <= 0) return
    const id = setInterval(() => void refresh(), pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs, enabled])

  return { data, loading, error, refresh, lastRefreshed }
}
