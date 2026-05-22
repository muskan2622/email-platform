"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { AnimatedCounter } from "@/components/motion/animated-counter"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { formatRelativeTime } from "@/lib/utils/time"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"

function statusUi(status: string) {
  if (status === "sent")
    return {
      label: "sent",
      icon: CheckCircle2,
      className:
        "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]",
    }
  if (status === "failed")
    return {
      label: "failed",
      icon: XCircle,
      className:
        "border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-[0_0_20px_-8px_rgba(251,113,133,0.4)]",
    }
  return {
    label: status,
    icon: MinusCircle,
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  }
}

export function EmailLogs() {
  const { data, loading, error } = usePlatformDataContext()
  const logs = data?.sendLog ?? []

  return (
    <>
      <TopNavbar title="Email Logs" subtitle="Delivery log · from Supabase send_log" />
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      <StaggerContainer className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Sent", value: data?.sentCount ?? 0, color: "text-emerald-400" },
          { label: "Skipped", value: data?.skippedCount ?? 0, color: "text-cyan-400" },
          { label: "Failed", value: data?.failedCount ?? 0, color: "text-rose-400" },
        ].map((s) => (
          <StaggerItem key={s.label}>
            <GlassCard className="p-5">
              <p className={`text-3xl font-semibold tabular-nums ${s.color}`}>
                {loading ? "—" : <AnimatedCounter value={s.value} />}
              </p>
              <p className="mt-1 text-sm text-flow-muted">{s.label}</p>
            </GlassCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <GlassCard className="overflow-hidden">
        {loading ? (
          <div className="p-5">
            <LoadingState rows={5} />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-5">
            <EmptyState
              message="No sends logged yet"
              hint="Trigger an event or send a test email to populate send_log."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-flow-glass-faint text-xs uppercase tracking-wider text-flow-faint">
                  <th className="px-5 py-4 font-medium">Recipient</th>
                  <th className="px-5 py-4 font-medium">Subject</th>
                  <th className="px-5 py-4 font-medium">Trigger</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row, i) => {
                  const ui = statusUi(row.status)
                  const Icon = ui.icon
                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="group border-b border-flow-glass-faint transition-colors hover:bg-flow-glass-subtle"
                    >
                      <td className="px-5 py-4 font-mono text-flow-secondary">
                        {row.end_users?.email ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-flow-secondary">
                        {row.rendered_subject ?? row.templates?.name ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-flow-muted">
                        {row.triggers?.name ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${ui.className}`}
                        >
                          <Icon className="h-3 w-3" />
                          {ui.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-flow-faint">
                        {formatRelativeTime(row.created_at)}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </>
  )
}
