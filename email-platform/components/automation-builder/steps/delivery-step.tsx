"use client"

import { motion } from "framer-motion"
import { Clock, Repeat, Shield } from "lucide-react"
import { WizardLabel, WizardSelect } from "@/components/automation-builder/shared/wizard-input"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"
import type { DeliveryMode } from "@/lib/types/automation"
import { cn } from "@/lib/utils"

const MODES: { id: DeliveryMode; label: string; description: string; icon: typeof Repeat }[] = [
  {
    id: "every_trigger",
    label: "Send every trigger",
    description: "Email sends each time the event fires (respecting cooldown).",
    icon: Repeat,
  },
  {
    id: "once_per_user",
    label: "Once per user",
    description: "Only the first matching event per user triggers a send.",
    icon: Shield,
  },
  {
    id: "cooldown",
    label: "Cooldown period",
    description: "Limit how often the same user can receive this automation.",
    icon: Clock,
  },
]

const DELAY_PRESETS = [
  { label: "Immediately", minutes: 0 },
  { label: "10 minutes", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "1 day", minutes: 60 * 24 },
]

export function DeliveryStep() {
  const { draft, patchDraft } = useAutomationWizardStore()
  const rules = draft.delivery_rules

  const setRules = (patch: Partial<typeof rules>) => {
    patchDraft({ delivery_rules: { ...rules, ...patch } })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-flow">Delivery & frequency</h2>
        <p className="mt-1 text-sm text-flow-muted">
          Control timing and how often users can receive this email.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {MODES.map((mode) => {
          const Icon = mode.icon
          const active = rules.mode === mode.id
          return (
            <motion.button
              key={mode.id}
              type="button"
              whileHover={{ y: -2 }}
              onClick={() => setRules({ mode: mode.id })}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_24px_-8px_rgba(34,211,238,0.35)]"
                  : "border-flow-glass bg-flow-glass-subtle hover:border-flow-glass-hover"
              )}
              aria-pressed={active}
            >
              <Icon className={cn("h-5 w-5", active ? "text-cyan-300" : "text-flow-muted")} />
              <p className="mt-3 font-medium text-flow">{mode.label}</p>
              <p className="mt-1 text-xs text-flow-muted">{mode.description}</p>
            </motion.button>
          )
        })}
      </section>

      <section className="rounded-2xl border border-flow-glass bg-flow-glass-subtle/50 p-6">
        <h3 className="text-sm font-semibold text-flow">Delay sending</h3>
        <p className="mt-1 text-xs text-flow-muted">Wait before the email leaves the queue.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {DELAY_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() =>
                setRules({
                  delay_minutes: preset.minutes,
                  send_immediately: preset.minutes === 0,
                })
              }
              className={cn(
                "rounded-xl px-4 py-2 text-sm transition-colors",
                rules.delay_minutes === preset.minutes
                  ? "bg-violet-500/25 font-medium text-violet-200"
                  : "border border-flow-glass text-flow-muted hover:text-flow"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <WizardLabel>Custom delay (minutes)</WizardLabel>
          <input
            type="range"
            min={0}
            max={10080}
            step={10}
            value={rules.delay_minutes}
            onChange={(e) =>
              setRules({
                delay_minutes: Number(e.target.value),
                send_immediately: Number(e.target.value) === 0,
              })
            }
            className="mt-2 w-full accent-violet-500"
            aria-valuenow={rules.delay_minutes}
          />
          <p className="mt-1 text-xs text-flow-faint">
            {rules.delay_minutes === 0
              ? "Sends immediately after conditions match"
              : `Waits ${rules.delay_minutes} minutes before sending`}
          </p>
        </div>
      </section>

      {rules.mode === "cooldown" && (
        <section className="rounded-2xl border border-flow-glass p-6">
          <WizardLabel>Cooldown (days between sends)</WizardLabel>
          <WizardSelect
            value={String(rules.cooldown_days)}
            onChange={(e) => setRules({ cooldown_days: Number(e.target.value) })}
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
          </WizardSelect>
        </section>
      )}

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-flow-glass px-4 py-3">
        <input
          type="checkbox"
          checked={rules.max_sends_per_user === 1 && rules.mode === "once_per_user"}
          onChange={(e) =>
            setRules({
              max_sends_per_user: e.target.checked ? 1 : null,
              mode: e.target.checked ? "once_per_user" : rules.mode,
            })
          }
          className="h-4 w-4 rounded accent-violet-500"
        />
        <span className="text-sm text-flow-secondary">
          Maximum 1 send per user (recommended for onboarding)
        </span>
      </label>
    </div>
  )
}
