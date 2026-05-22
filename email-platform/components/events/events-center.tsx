"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import { ChevronDown, Zap } from "lucide-react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { GlowPulse } from "@/components/motion/glow-pulse"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { formatRelativeTime } from "@/lib/utils/time"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import type { EventRecord } from "@/lib/types/database"

function eventStatus(ev: EventRecord) {
  if (!ev.processed_at) return { label: "pending", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" }
  const sent = ev.processing_result?.evaluations?.some((e) => e.status === "sent")
  if (sent) return { label: "sent", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" }
  return { label: "processed", className: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" }
}

export function EventsCenter() {
  const { data, loading, error } = usePlatformDataContext()
  const [expanded, setExpanded] = useState<string | null>(null)
  const events = data?.events ?? []
  const selected = events.find((e) => e.id === expanded) ?? events[0]

  useEffect(() => {
    if (events.length && !expanded) setExpanded(events[0].id)
  }, [events, expanded])

  return (
    <>
      <TopNavbar title="Event Monitor" subtitle="Live control center · from Supabase" />
      {error ? (
        <p className="mb-4 text-sm text-rose-400">{error}</p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard className="p-4 md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <GlowPulse color="cyan" />
            <span className="text-sm font-medium text-flow">Incoming events</span>
            <span className="ml-auto rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
              {loading ? "…" : `${events.length} loaded`}
            </span>
          </div>
          {loading ? (
            <LoadingState rows={4} />
          ) : events.length === 0 ? (
            <EmptyState
              message="No events yet"
              hint='POST to /api/events with type "user.plan_upgraded" to test.'
            />
          ) : (
            <ul className="space-y-3">
              <AnimatePresence mode="popLayout">
                {events.map((ev, i) => {
                  const status = eventStatus(ev)
                  return (
                    <motion.li
                      key={ev.id}
                      layout
                      initial={{ opacity: 0, y: -20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="overflow-hidden rounded-xl border border-flow-glass-faint bg-flow-glass-subtle"
                    >
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-flow-glass-subtle"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                          <Zap className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm text-flow">{ev.type}</p>
                          <p className="text-[11px] text-flow-faint">
                            {formatRelativeTime(ev.created_at)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-flow-faint transition-transform ${expanded === ev.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {expanded === ev.id && (
                          <motion.pre
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-flow-glass-faint bg-flow-glass-inset px-4 py-3 font-mono text-xs text-cyan-200/80"
                          >
                            {JSON.stringify(ev.payload, null, 2)}
                          </motion.pre>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-medium text-flow">Processing pipeline</h3>
          {selected?.processing_result?.evaluations?.length ? (
            <div className="relative space-y-6 pl-4 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-8px)] before:w-px before:bg-gradient-to-b before:from-violet-500 before:to-transparent">
              {selected.processing_result.evaluations.map((ev, i) => (
                <motion.div
                  key={ev.trigger_id + String(i)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="relative"
                >
                  <span className="absolute -left-4 top-1 h-2.5 w-2.5 rounded-full border-2 border-violet-400 bg-[var(--flow-page-bg-end)]" />
                  <p className="text-sm text-flow-secondary">{ev.trigger_name}</p>
                  <p className="text-[10px] text-flow-faint">{ev.status}{ev.skip_reason ? ` · ${ev.skip_reason}` : ""}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              message={selected ? "No evaluations yet" : "Select an event"}
              hint="Expand an event to see trigger results."
            />
          )}
        </GlassCard>
      </div>
    </>
  )
}
