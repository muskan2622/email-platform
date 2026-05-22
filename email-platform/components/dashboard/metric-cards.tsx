"use client"

import { Send, Zap, FileText, AlertTriangle } from "lucide-react"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { GlassCard } from "@/components/motion/glass-card"
import { TiltCard } from "@/components/motion/tilt-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"

export function MetricCards() {
  const { data, loading } = usePlatformDataContext()

  const metrics = [
    {
      label: "Emails sent",
      value: data?.sentCount ?? 0,
      icon: Send,
      accent: "from-violet-500/20 to-violet-500/5",
    },
    {
      label: "Events",
      value: data?.eventsCount ?? 0,
      icon: Zap,
      accent: "from-cyan-500/20 to-cyan-500/5",
    },
    {
      label: "Active triggers",
      value: data?.activeTriggers ?? 0,
      icon: FileText,
      accent: "from-indigo-500/20 to-indigo-500/5",
    },
    {
      label: "Failed sends",
      value: data?.failedCount ?? 0,
      icon: AlertTriangle,
      accent: "from-rose-500/20 to-rose-500/5",
    },
  ]

  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon
        return (
          <StaggerItem key={m.label}>
            <TiltCard>
              <GlassCard className={`relative overflow-hidden p-5 bg-gradient-to-br ${m.accent}`}>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                    <Icon className="h-4 w-4 text-white/70" />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-white">
                  {loading ? "—" : <AnimatedCounter value={m.value} />}
                </p>
                <p className="mt-1 text-sm text-white/45">{m.label}</p>
              </GlassCard>
            </TiltCard>
          </StaggerItem>
        )
      })}
    </StaggerContainer>
  )
}
