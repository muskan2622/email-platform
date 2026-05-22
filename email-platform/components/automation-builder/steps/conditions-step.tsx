"use client"

import { ConditionGroupEditor } from "@/components/automation-builder/conditions/condition-group"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"

export function ConditionsStep() {
  const { draft, patchDraft, validationErrors } = useAutomationWizardStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-flow">Who should receive this?</h2>
        <p className="mt-1 text-sm text-flow-muted">
          Build filters in plain language. No code required — we translate these into rules automatically.
        </p>
      </div>

      {validationErrors.conditions && (
        <p className="text-sm text-rose-400" role="alert">
          {validationErrors.conditions}
        </p>
      )}

      <ConditionGroupEditor
        group={draft.conditions}
        onChange={(conditions) => patchDraft({ conditions })}
      />
    </div>
  )
}
