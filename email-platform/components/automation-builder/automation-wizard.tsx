"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { ActivationModal } from "@/components/automation-builder/modals/activation-modal"
import { ConditionsStep } from "@/components/automation-builder/steps/conditions-step"
import { DeliveryStep } from "@/components/automation-builder/steps/delivery-step"
import { ReviewStep } from "@/components/automation-builder/steps/review-step"
import { TemplateStep } from "@/components/automation-builder/steps/template-step"
import { TriggerStep } from "@/components/automation-builder/steps/trigger-step"
import { WizardNav } from "@/components/automation-builder/wizard-nav"
import { WizardStepIndicator } from "@/components/automation-builder/wizard-step-indicator"
import { apiPost } from "@/lib/api/client"
import {
  useAutomationWizardStore,
  type WizardStep,
} from "@/lib/stores/automation-wizard-store"
import {
  automationWizardSchema,
  conditionsStepSchema,
  deliveryStepSchema,
  templateStepSchema,
  triggerStepSchema,
  WIZARD_STEPS,
} from "@/lib/validators/automation-wizard"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"

const stepComponents: Record<WizardStep, React.ComponentType> = {
  1: TriggerStep,
  2: ConditionsStep,
  3: TemplateStep,
  4: DeliveryStep,
  5: ReviewStep,
}

function validateStep(step: WizardStep, draft: ReturnType<typeof useAutomationWizardStore.getState>["draft"]) {
  const payload = {
    name: draft.name,
    trigger_event: draft.trigger_event,
    conditions: draft.conditions,
    template_id: draft.template_id,
    delivery_rules: draft.delivery_rules,
    status: "draft" as const,
  }

  switch (step) {
    case 1:
      return triggerStepSchema.safeParse(payload)
    case 2:
      return conditionsStepSchema.safeParse(payload)
    case 3:
      return templateStepSchema.safeParse(payload)
    case 4:
      return deliveryStepSchema.safeParse(payload)
    case 5:
      return automationWizardSchema.safeParse({
        ...payload,
        name: draft.name.trim() || `Automation — ${draft.trigger_event}`,
      })
    default:
      return { success: true as const, data: payload }
  }
}

export function AutomationWizard() {
  const {
    isOpen,
    step,
    draft,
    closeWizard,
    setStep,
    nextStep,
    prevStep,
    setValidationErrors,
    setSaving,
    setActivating,
    saving,
    activating,
    markSaved,
    resetWizard,
    history,
    future,
    undo,
    redo,
  } = useAutomationWizardStore()

  const { refresh } = usePlatformDataContext()
  const [activationOpen, setActivationOpen] = useState(false)
  const [activationSuccess, setActivationSuccess] = useState(false)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const StepComponent = stepComponents[step]
  const stepMeta = WIZARD_STEPS[step - 1]

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!draft.trigger_event && !draft.id) return
      setSaving(true)
      try {
        const result = await apiPost<{ id: string }>("/api/automations", {
          id: draft.id ?? undefined,
          draft: true,
          name: draft.name || `Draft — ${draft.trigger_event || "automation"}`,
          description: draft.description,
          trigger_event: draft.trigger_event || "user.signup",
          conditions: draft.conditions,
          template_id: draft.template_id || undefined,
          delivery_rules: draft.delivery_rules,
        })
        markSaved(result.id)
        if (!silent) void refresh()
      } catch {
        if (!silent) {
          setValidationErrors({
            save:
              "Could not save draft. Run 20250524000003_ensure_automation_builder.sql in Supabase if tables are missing.",
          })
        }
      } finally {
        setSaving(false)
      }
    },
    [draft, markSaved, refresh, setSaving, setValidationErrors]
  )

  useEffect(() => {
    if (!isOpen) return
    if (autosaveRef.current) clearTimeout(autosaveRef.current)
    autosaveRef.current = setTimeout(() => {
      if (draft.trigger_event) void saveDraft(true)
    }, 4000)
    return () => {
      if (autosaveRef.current) clearTimeout(autosaveRef.current)
    }
  }, [isOpen, draft, saveDraft])

  const handleNext = () => {
    const result = validateStep(step, draft)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "form")
        errors[key] = issue.message
      }
      setValidationErrors(errors)
      return
    }
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next.template_id
      delete next.trigger_event
      delete next.conditions
      delete next.delivery_rules
      delete next.form
      return next
    })
    if (step < 5) nextStep()
  }

  const handleActivate = async () => {
    const result = automationWizardSchema.safeParse({
      name: draft.name.trim() || `Automation — ${draft.trigger_event}`,
      description: draft.description,
      trigger_event: draft.trigger_event,
      conditions: draft.conditions,
      template_id: draft.template_id,
      delivery_rules: draft.delivery_rules,
      status: "active",
    })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message
      }
      setValidationErrors(errors)
      return
    }

    setActivating(true)
    try {
      await apiPost("/api/automations", {
        id: draft.id ?? undefined,
        activate: true,
        ...result.data,
        audience_estimate: useAutomationWizardStore.getState().audienceEstimate,
      })
      setActivationSuccess(true)
      void refresh()
    } catch (e) {
      setValidationErrors({
        activate: e instanceof Error ? e.message : "Activation failed",
      })
      setActivationOpen(false)
    } finally {
      setActivating(false)
    }
  }

  const handleCloseSuccess = () => {
    setActivationOpen(false)
    setActivationSuccess(false)
    resetWizard()
    closeWizard()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex flex-col"
        >
          <div className="absolute inset-0 bg-[var(--flow-page-bg)]/95 backdrop-blur-xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139,92,246,0.25), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(34,211,238,0.12), transparent)",
            }}
          />

          <header className="relative z-10 flex shrink-0 items-center justify-between border-b border-flow-glass px-4 py-4 md:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-violet-400/90">
                New automation
              </p>
              <h1 className="text-xl font-semibold text-flow md:text-2xl">
                {stepMeta.title}
              </h1>
              <p className="text-sm text-flow-muted">{stepMeta.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={closeWizard}
              className="rounded-xl border border-flow-glass p-2.5 text-flow-muted transition-colors hover:text-flow"
              aria-label="Close wizard"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="relative z-10 shrink-0 px-4 py-4 md:px-8">
            <WizardStepIndicator currentStep={step} />
          </div>

          <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-6 md:px-8">
            <div className="mx-auto max-w-4xl rounded-2xl border border-flow-glass/80 bg-flow-glass-subtle/30 p-6 backdrop-blur-md md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <StepComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <div className="relative z-10 shrink-0 border-t border-flow-glass bg-flow-glass-subtle/50 px-4 py-4 md:px-8">
            <div className="mx-auto max-w-4xl">
              <WizardNav
                canBack={step > 1}
                onBack={prevStep}
                onNext={
                  step < 5
                    ? handleNext
                    : () => setActivationOpen(true)
                }
                nextLabel={step < 5 ? "Continue" : "Activate automation"}
                canNext={
                  step === 1
                    ? !!draft.trigger_event
                    : step === 3
                      ? !!draft.template_id
                      : true
                }
                onSaveDraft={() => void saveDraft(false)}
                saving={saving}
                onUndo={undo}
                onRedo={redo}
                canUndo={history.length > 0}
                canRedo={future.length > 0}
              />
              {draft.lastSavedAt && (
                <p className="mt-2 text-center text-[10px] text-flow-faint">
                  Draft saved {new Date(draft.lastSavedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          <ActivationModal
            open={activationOpen}
            loading={activating}
            success={activationSuccess}
            automationName={draft.name || "Automation"}
            onConfirm={() => void handleActivate()}
            onClose={() =>
              activationSuccess ? handleCloseSuccess() : setActivationOpen(false)
            }
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
