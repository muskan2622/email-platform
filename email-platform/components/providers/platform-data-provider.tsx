"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import {
  usePlatformData,
  type PlatformStats,
} from "@/lib/hooks/use-platform-data"

type ContextValue = {
  data: PlatformStats | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const PlatformDataContext = createContext<ContextValue | null>(null)

export function PlatformDataProvider({ children }: { children: ReactNode }) {
  const { data, error, loading, refresh } = usePlatformData()
  const value = useMemo(
    () => ({ data, error, loading, refresh }),
    [data, error, loading, refresh]
  )
  return (
    <PlatformDataContext.Provider value={value}>
      {children}
    </PlatformDataContext.Provider>
  )
}

export function usePlatformDataContext() {
  const ctx = useContext(PlatformDataContext)
  if (!ctx) {
    throw new Error("usePlatformDataContext must be used within PlatformDataProvider")
  }
  return ctx
}

/** Use provider when available; otherwise fetch locally (e.g. standalone pages). */
