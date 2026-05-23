"use client"

import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import { OPERATOR_LABELS } from "@/lib/automation/field-definitions"
import { humanizeRule } from "@/lib/automation/humanize-conditions"
import { useAutomationCatalog } from "@/lib/hooks/use-automation-catalog"
import type { ConditionOperator, ConditionRule } from "@/lib/types/database"
import { WizardLabel, WizardSelect } from "@/components/automation-builder/shared/wizard-input"
import { cn } from "@/lib/utils"

type ConditionRowProps = {
  rule: ConditionRule
  index: number
  onChange: (rule: ConditionRule) => void
  onRemove: () => void
  invalid?: boolean
}

export function ConditionRow({ rule, index, onChange, onRemove, invalid }: ConditionRowProps) {
  const { conditionFields, getFieldDefinition } = useAutomationCatalog()
  const fieldDef = getFieldDefinition(rule.field)
  const operators = fieldDef?.operators ?? ["eq", "neq"]

  const valueOptions = fieldDef?.options

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className={cn(
        "group rounded-2xl border bg-flow-glass-subtle/80 p-4 backdrop-blur-sm transition-colors",
        invalid ? "border-rose-500/50" : "border-flow-glass hover:border-violet-500/30"
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-flow-secondary">
          {index === 0 ? "When" : "And also"}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-flow-faint transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          aria-label="Remove condition"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 rounded-lg bg-violet-500/10 px-3 py-2 text-sm text-violet-200/90">
        {humanizeRule(rule, conditionFields)}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <WizardLabel>Property</WizardLabel>
          <WizardSelect
            value={rule.field}
            onChange={(e) => {
              const next = conditionFields.find((f) => f.field === e.target.value)
              onChange({
                field: e.target.value,
                op: next?.operators[0] ?? "eq",
                value: next?.options?.[0]?.value ?? "",
              })
            }}
          >
            {conditionFields.map((f) => (
              <option key={f.field} value={f.field}>
                {f.label}
              </option>
            ))}
          </WizardSelect>
        </div>

        <div>
          <WizardLabel>Comparison</WizardLabel>
          <WizardSelect
            value={rule.op}
            onChange={(e) =>
              onChange({ ...rule, op: e.target.value as ConditionOperator })
            }
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </WizardSelect>
        </div>

        <div>
          <WizardLabel>Value</WizardLabel>
          {valueOptions ? (
            <WizardSelect
              value={String(rule.value ?? "")}
              onChange={(e) => onChange({ ...rule, value: e.target.value })}
            >
              {valueOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </WizardSelect>
          ) : (
            <input
              type={fieldDef?.valueType === "number" ? "number" : "text"}
              value={String(rule.value ?? "")}
              onChange={(e) =>
                onChange({
                  ...rule,
                  value:
                    fieldDef?.valueType === "number"
                      ? Number(e.target.value)
                      : e.target.value,
                })
              }
              className="w-full rounded-xl border border-flow-glass bg-flow-glass-subtle px-4 py-2.5 text-sm text-flow outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
