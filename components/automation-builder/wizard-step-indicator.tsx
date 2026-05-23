"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { WIZARD_STEPS } from "@/lib/validators/automation-wizard"
import type { WizardStep } from "@/lib/stores/automation-wizard-store"

export function WizardStepIndicator({ currentStep }: { currentStep: WizardStep }) {
  return (
    <nav aria-label="Automation wizard progress" className="w-full">
      <ol className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        {WIZARD_STEPS.map((step) => {
          const done = currentStep > step.id
          const active = currentStep === step.id
          return (
            <li key={step.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                  done && "border-emerald-500/50 bg-emerald-500/20 text-emerald-400",
                  active && "border-violet-500/60 bg-violet-500/25 text-violet-200 shadow-[0_0_20px_-4px_rgba(139,92,246,0.6)]",
                  !done && !active && "border-flow-glass text-flow-faint"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={cn(
                    "text-xs font-medium",
                    active ? "text-flow" : "text-flow-muted"
                  )}
                >
                  {step.title}
                </p>
              </div>
              {step.id < WIZARD_STEPS.length && (
                <motion.div
                  className="mx-1 hidden h-px w-6 bg-gradient-to-r from-violet-500/40 to-transparent md:block"
                  initial={false}
                  animate={{ opacity: done ? 1 : 0.25 }}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
