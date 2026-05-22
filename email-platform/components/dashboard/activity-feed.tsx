"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/motion/glass-card"
import { GlowPulse } from "@/components/motion/glow-pulse"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { formatRelativeTime } from "@/lib/utils/time"
import { EmptyState } from "@/components/ui/empty-state"

function statusColor(status: string): "emerald" | "cyan" | "violet" | "rose" {
  if (status === "sent") return "emerald"
  if (status === "failed") return "rose"
  if (status === "skipped") return "violet"
  return "cyan"
}

export function ActivityFeed() {
  const { data, loading } = usePlatformDataContext()

  const items = [
    ...(data?.sendLog ?? []).slice(0, 5).map((log) => ({
      id: log.id,
      time: formatRelativeTime(log.created_at),
      title: `${log.triggers?.name ?? "Send"} → ${log.end_users?.email ?? "—"}`,
      status: log.status,
    })),
    ...(data?.events ?? []).slice(0, 3).map((ev) => ({
      id: ev.id,
      time: formatRelativeTime(ev.created_at),
      title: ev.type,
      status: ev.processed_at ? "processed" : "received",
    })),
  ].slice(0, 8)

  return (
    <GlassCard className="flex h-full flex-col p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Live activity</h3>
        <GlowPulse color="emerald" />
      </div>
      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState message="No activity yet" hint="Ingest an event to see activity here." />
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-hidden">
          {items.map((e, i) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
            >
              <GlowPulse color={statusColor(e.status)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/90">{e.title}</p>
                <p className="text-[11px] text-white/35">{e.time}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/50">
                {e.status}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </GlassCard>
  )
}
