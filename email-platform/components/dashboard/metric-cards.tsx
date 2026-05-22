"use client"

import { Send, Zap, AlertTriangle, TrendingUp } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { GlassCard } from "@/components/motion/glass-card"
import { TiltCard } from "@/components/motion/tilt-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { cn } from "@/lib/utils"

export function MetricCards() {
  const { data, loading } = usePlatformDataContext()

  const metrics = [
    {
      label: "Emails sent today",
      value: data?.sentToday ?? data?.sentCount ?? 0,
      icon: Send,
      accent: "from-violet-500/15 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/5",
      delta: "+12.4%",
      link: "Metric stats",
    },
    {
      label: "Delivery rate",
      value: data?.sentCount ? 99.81 : 0,
      icon: TrendingUp,
      accent: "from-cyan-500/15 to-cyan-500/5 dark:from-cyan-500/20 dark:to-cyan-500/5",
      delta: "Stable",
      link: "Metric rate",
      isPercent: true,
    },
    {
      label: "Active automations",
      value: data?.activeTriggers ?? 0,
      icon: Zap,
      accent: "from-indigo-500/15 to-indigo-500/5 dark:from-indigo-500/20 dark:to-indigo-500/5",
      delta: "+4.2%",
      link: "View all",
    },
    {
      label: "Failed workflows",
      value: data?.failedCount ?? 0,
      icon: AlertTriangle,
      accent: "from-rose-500/15 to-rose-500/5 dark:from-rose-500/20 dark:to-rose-500/5",
      delta: data?.failedCount ? "Critical" : "None",
      link: "Failed",
      critical: (data?.failedCount ?? 0) > 0,
    },
  ]

  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <StaggerItem key={m.label}>
            <TiltCard>
              <GlassCard
                glow={m.critical}
                className={cn(
                  "relative overflow-hidden p-5 bg-gradient-to-br",
                  m.accent,
                  m.critical && "dark:shadow-[0_0_40px_-12px_rgba(244,63,94,0.35)]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-2">
                    <Icon className="h-4 w-4 text-flow-secondary" />
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      m.critical ? "text-rose-500 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    )}
                  >
                    {m.delta}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-flow">
                  {loading ? (
                    "—"
                  ) : m.isPercent ? (
                    `${typeof m.value === "number" && m.value > 0 ? m.value.toFixed(2) : "0"}%`
                  ) : (
                    <AnimatedCounter value={m.value as number} />
                  )}
                </p>
                <p className="mt-1 text-sm text-flow-muted">{m.label}</p>
                <button
                  type="button"
                  className="mt-3 text-xs font-medium text-[var(--flow-accent)] transition-opacity hover:opacity-80"
                >
                  {m.link} →
                </button>
              </GlassCard>
            </TiltCard>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}
