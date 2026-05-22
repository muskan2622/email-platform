"use client"

import { motion } from "framer-motion"
import { Filter, GitBranch, Mail, Zap } from "lucide-react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { parseConditionGroup } from "@/lib/engine/conditions"
import type { ConditionGroup } from "@/lib/types/database"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"

function conditionSummary(conditions: ConditionGroup): string {
  const rules = conditions?.rules ?? []
  if (rules.length === 0) return "No conditions"
  return rules
    .map((r) => `${r.field} ${r.op} ${String(r.value ?? "")}`)
    .join(", ")
}

function buildNodes(trigger: {
  event_type: string
  conditions: ConditionGroup
  templates: { name: string } | null
}) {
  return [
    {
      id: "trigger",
      label: "Event Trigger",
      sub: trigger.event_type,
      icon: Zap,
      color: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    },
    {
      id: "condition",
      label: "Conditions",
      sub: conditionSummary(trigger.conditions),
      icon: Filter,
      color: "border-violet-500/40 bg-violet-500/10 text-violet-200",
    },
    {
      id: "template",
      label: "Template",
      sub: trigger.templates?.name ?? "—",
      icon: GitBranch,
      color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
    },
    {
      id: "send",
      label: "Send",
      sub: "Resend API",
      icon: Mail,
      color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
    },
  ]
}

export function WorkflowBuilder() {
  const { data, loading, error } = usePlatformDataContext()
  const triggers = data?.triggers ?? []
  const active = triggers.find((t) => t.enabled) ?? triggers[0]
  const activeConditions = active
    ? parseConditionGroup(active.conditions)
    : { operator: "and" as const, rules: [] }
  const nodes = active
    ? buildNodes({ ...active, conditions: activeConditions })
    : []

  const pills =
    activeConditions.rules?.map(
      (r) => `${r.field.replace(/^user\.|^payload\./, "")} ${r.op} ${String(r.value ?? "")}`
    ) ?? []

  return (
    <>
      <TopNavbar title="Rule Engine" subtitle="Triggers from Supabase · Event → Conditions → Template → Send" />
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <LoadingState rows={2} />
      ) : !active ? (
        <EmptyState
          message="No triggers configured"
          hint="Run the seed migration or create a trigger via POST /api/triggers."
        />
      ) : (
        <GlassCard className="relative min-h-[480px] overflow-hidden p-6 md:p-10">
          <p className="mb-6 text-sm text-white/50">
            Showing: <span className="text-white">{active.name}</span>
            {triggers.length > 1 ? ` · ${triggers.length} triggers total` : ""}
          </p>
          <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            <defs>
              <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((i) => (
              <motion.line
                key={i}
                x1={`${8 + i * 30 + 12}%`}
                y1="50%"
                x2={`${8 + (i + 1) * 30 - 4}%`}
                y2="50%"
                stroke="url(#flowLine)"
                strokeWidth="2"
                strokeDasharray="6 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.8 }}
              />
            ))}
          </svg>

          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-4">
            {nodes.map((node, i) => {
              const Icon = node.icon
              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, y: 24, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.12 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="relative z-10 flex flex-1 flex-col items-center"
                >
                  <div
                    className={`w-full max-w-[200px] rounded-2xl border p-4 shadow-[0_0_40px_-16px_rgba(99,102,241,0.4)] backdrop-blur-md ${node.color}`}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="font-medium text-white">{node.label}</p>
                    <p className="mt-1 line-clamp-2 text-xs opacity-70">{node.sub}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
            <div className="flex flex-wrap gap-2">
              {pills.length > 0 ? (
                pills.map((pill) => (
                  <motion.span
                    key={pill}
                    className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200"
                  >
                    {pill}
                  </motion.span>
                ))
              ) : (
                <span className="text-xs text-white/40">No condition rules</span>
              )}
              {active.send_once_per_user ? (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  Send once per user
                </span>
              ) : null}
            </div>
          </div>

          {triggers.length > 1 ? (
            <ul className="mt-8 space-y-2 border-t border-white/[0.06] pt-6">
              <p className="mb-2 text-xs uppercase tracking-wider text-white/40">All triggers</p>
              {triggers.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span className="text-white/80">{t.name}</span>
                  <span className="font-mono text-xs text-white/40">{t.event_type}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </GlassCard>
      )}
    </>
  )
}
