"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Sparkles, Users } from "lucide-react"
import { humanizeConditionGroup } from "@/lib/automation/humanize-conditions"
import { useAutomationCatalog } from "@/lib/hooks/use-automation-catalog"
import { WizardInput, WizardLabel } from "@/components/automation-builder/shared/wizard-input"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"
import { apiPost } from "@/lib/api/client"
import { cn } from "@/lib/utils"

function formatDelay(minutes: number) {
  if (minutes === 0) return "immediately"
  if (minutes < 60) return `${minutes} minutes`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} hours`
  return `${Math.round(minutes / (60 * 24))} day(s)`
}

export function ReviewStep() {
  const { data } = usePlatformDataContext()
  const {
    draft,
    patchDraft,
    audienceEstimate,
    setAudienceEstimate,
    setEstimateLoading,
    estimateLoading,
  } = useAutomationWizardStore()

  const { findTrigger, conditionFields } = useAutomationCatalog()
  const trigger = findTrigger(draft.trigger_event)
  const template = data?.templates.find((t) => t.id === draft.template_id)
  const conditionLines = humanizeConditionGroup(draft.conditions, conditionFields)
  const rules = draft.delivery_rules

  useEffect(() => {
    if (!draft.trigger_event) return
    let cancelled = false
    setEstimateLoading(true)
    void apiPost<{
      estimate: number
      matched_users: number
      confidence: string
    }>("/api/automations/estimate", {
      trigger_event: draft.trigger_event,
      conditions: draft.conditions,
    })
      .then((res) => {
        if (!cancelled) setAudienceEstimate(res.estimate)
      })
      .catch(() => {
        if (!cancelled) setAudienceEstimate(null)
      })
      .finally(() => {
        if (!cancelled) setEstimateLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [draft.trigger_event, draft.conditions, setAudienceEstimate, setEstimateLoading])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-flow">Review & activate</h2>
        <p className="mt-1 text-sm text-flow-muted">
          Confirm your automation before it goes live.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <WizardLabel>Automation name</WizardLabel>
          <WizardInput
            value={draft.name}
            onChange={(e) => patchDraft({ name: e.target.value })}
            placeholder="e.g. Pro upgrade welcome"
          />
        </div>
        <div>
          <WizardLabel>Description (optional)</WizardLabel>
          <WizardInput
            value={draft.description}
            onChange={(e) => patchDraft({ description: e.target.value })}
            placeholder="Internal note for your team"
          />
        </div>
      </div>

      <motion.div
        layout
        className="overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 p-6"
      >
        <div className="space-y-4 font-mono text-sm">
          <SummaryBlock title="WHEN" accent="cyan">
            <span className="text-flow">{trigger?.label ?? draft.trigger_event}</span>
            <code className="ml-2 text-xs text-flow-faint">{draft.trigger_event}</code>
          </SummaryBlock>

          <SummaryBlock title="IF" accent="violet">
            {conditionLines.length === 0 ? (
              <span className="text-flow-muted">All users matching the trigger</span>
            ) : (
              <ul className="space-y-1 text-flow-secondary">
                {conditionLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </SummaryBlock>

          <SummaryBlock title="THEN" accent="emerald">
            Send template{" "}
            <span className="font-semibold text-flow">
              &quot;{template?.name ?? "—"}&quot;
            </span>
          </SummaryBlock>

          <SummaryBlock title="RULES" accent="amber">
            <ul className="space-y-1 text-flow-secondary">
              <li>
                {rules.mode === "once_per_user"
                  ? "Once per user"
                  : rules.mode === "cooldown"
                    ? `Cooldown: ${rules.cooldown_days} days`
                    : "Every matching trigger"}
              </li>
              <li>Delay: {formatDelay(rules.delay_minutes)}</li>
            </ul>
          </SummaryBlock>
        </div>
      </motion.div>

      <div
        className={cn(
          "flex items-center gap-4 rounded-2xl border border-flow-glass px-5 py-4",
          "bg-flow-glass-subtle/80"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
          {estimateLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-violet-300" />
          ) : (
            <Users className="h-5 w-5 text-violet-300" />
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-flow-faint">
            Estimated audience
          </p>
          <p className="text-2xl font-semibold text-flow">
            {estimateLoading
              ? "Calculating…"
              : audienceEstimate != null
                ? `~${audienceEstimate.toLocaleString()} users`
                : "—"}
          </p>
        </div>
        <Sparkles className="ml-auto h-5 w-5 text-violet-400/60" />
      </div>
    </div>
  )
}

function SummaryBlock({
  title,
  children,
  accent,
}: {
  title: string
  children: React.ReactNode
  accent: "cyan" | "violet" | "emerald" | "amber"
}) {
  const colors = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
  }
  return (
    <div>
      <span className={cn("text-xs font-bold tracking-widest", colors[accent])}>
        {title}
      </span>
      <div className="mt-1 pl-0">{children}</div>
    </div>
  )
}
