"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/motion/glass-card"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"

function bucketSendsByHour(
  logs: { created_at: string; status: string }[]
): number[] {
  const buckets = Array(12).fill(0) as number[]
  const now = Date.now()
  for (const log of logs) {
    if (log.status !== "sent") continue
    const age = now - new Date(log.created_at).getTime()
    const hoursAgo = Math.floor(age / (1000 * 60 * 60))
    if (hoursAgo >= 0 && hoursAgo < 12) {
      buckets[11 - hoursAgo] += 1
    }
  }
  return buckets.map((n) => (n === 0 ? 2 : n * 12 + 20))
}

export function AnimatedChart() {
  const { data, loading } = usePlatformDataContext()
  const points = useMemo(
    () => bucketSendsByHour(data?.sendLog ?? []),
    [data?.sendLog]
  )

  const w = 400
  const h = 120
  const max = Math.max(...points, 1)
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w
      const y = h - (p / max) * (h - 20) - 10
      return `${i === 0 ? "M" : "L"} ${x} ${y}`
    })
    .join(" ")
  const area = `${path} L ${w} ${h} L 0 ${h} Z`
  const totalSent = data?.sentCount ?? 0

  return (
    <GlassCard className="p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-flow">Delivery throughput</h3>
          <p className="text-xs text-flow-muted">
            {loading ? "Loading…" : `Last 12h · ${totalSent} total sent`}
          </p>
        </div>
        <span className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          From send_log
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[140px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill="url(#chartFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="url(#chartLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </GlassCard>
  )
}
