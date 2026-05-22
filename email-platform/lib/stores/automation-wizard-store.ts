import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ConditionGroup } from "@/lib/types/database"
import type { DeliveryRules } from "@/lib/types/automation"
import { DEFAULT_DELIVERY_RULES } from "@/lib/types/automation"
import { defaultWizardValues } from "@/lib/validators/automation-wizard"

const MAX_HISTORY = 40

export type WizardStep = 1 | 2 | 3 | 4 | 5

export interface WizardDraft {
  id: string | null
  name: string
  description: string
  trigger_event: string
  conditions: ConditionGroup
  template_id: string
  delivery_rules: DeliveryRules
  lastSavedAt: number | null
}

interface HistorySnapshot {
  draft: WizardDraft
  step: WizardStep
}

interface AutomationWizardState {
  isOpen: boolean
  step: WizardStep
  draft: WizardDraft
  history: HistorySnapshot[]
  future: HistorySnapshot[]
  audienceEstimate: number | null
  estimateLoading: boolean
  saving: boolean
  activating: boolean
  validationErrors: Record<string, string>
  openWizard: (step?: WizardStep) => void
  closeWizard: () => void
  setStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  patchDraft: (patch: Partial<WizardDraft>) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  resetWizard: () => void
  setAudienceEstimate: (n: number | null) => void
  setEstimateLoading: (v: boolean) => void
  setSaving: (v: boolean) => void
  setActivating: (v: boolean) => void
  setValidationErrors: (errors: Record<string, string>) => void
  markSaved: (id?: string) => void
}

const emptyDraft = (): WizardDraft => {
  const defaults = defaultWizardValues()
  return {
    id: null,
    name: defaults.name,
    description: defaults.description ?? "",
    trigger_event: defaults.trigger_event,
    conditions: { operator: "and", rules: [] },
    template_id: defaults.template_id,
    delivery_rules: { ...DEFAULT_DELIVERY_RULES },
    lastSavedAt: null,
  }
}

function cloneDraft(d: WizardDraft): WizardDraft {
  return JSON.parse(JSON.stringify(d)) as WizardDraft
}

export const useAutomationWizardStore = create<AutomationWizardState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      step: 1,
      draft: emptyDraft(),
      history: [],
      future: [],
      audienceEstimate: null,
      estimateLoading: false,
      saving: false,
      activating: false,
      validationErrors: {},

      openWizard: (step = 1) =>
        set({ isOpen: true, step, validationErrors: {} }),

      closeWizard: () => set({ isOpen: false }),

      setStep: (step) => set({ step }),

      nextStep: () => {
        const { step } = get()
        if (step < 5) set({ step: (step + 1) as WizardStep })
      },

      prevStep: () => {
        const { step } = get()
        if (step > 1) set({ step: (step - 1) as WizardStep })
      },

      patchDraft: (patch) => {
        set((s) => ({
          draft: { ...s.draft, ...patch },
          future: [],
        }))
      },

      pushHistory: () => {
        const { draft, step, history } = get()
        const snap: HistorySnapshot = {
          draft: cloneDraft(draft),
          step,
        }
        const next = [...history, snap].slice(-MAX_HISTORY)
        set({ history: next })
      },

      undo: () => {
        const { history, draft, step, future } = get()
        if (history.length === 0) return
        const prev = history[history.length - 1]
        set({
          history: history.slice(0, -1),
          future: [{ draft: cloneDraft(draft), step }, ...future].slice(0, MAX_HISTORY),
          draft: prev.draft,
          step: prev.step,
        })
      },

      redo: () => {
        const { future, draft, step, history } = get()
        if (future.length === 0) return
        const next = future[0]
        set({
          future: future.slice(1),
          history: [...history, { draft: cloneDraft(draft), step }].slice(-MAX_HISTORY),
          draft: next.draft,
          step: next.step,
        })
      },

      resetWizard: () =>
        set({
          step: 1,
          draft: emptyDraft(),
          history: [],
          future: [],
          audienceEstimate: null,
          validationErrors: {},
        }),

      setAudienceEstimate: (n) => set({ audienceEstimate: n }),
      setEstimateLoading: (v) => set({ estimateLoading: v }),
      setSaving: (v) => set({ saving: v }),
      setActivating: (v) => set({ activating: v }),
      setValidationErrors: (errors) => set({ validationErrors: errors }),

      markSaved: (id) =>
        set((s) => ({
          draft: {
            ...s.draft,
            id: id ?? s.draft.id,
            lastSavedAt: Date.now(),
          },
        })),
    }),
    {
      name: "pulsemail-automation-wizard",
      partialize: (s) => ({
        draft: s.draft,
        step: s.step,
      }),
    }
  )
)
