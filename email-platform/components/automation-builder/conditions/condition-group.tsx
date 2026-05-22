"use client"

import { AnimatePresence } from "framer-motion"
import { Layers, Plus } from "lucide-react"
import { ConditionRow } from "@/components/automation-builder/conditions/condition-row"
import type { ConditionGroup, ConditionRule } from "@/lib/types/database"
import { cn } from "@/lib/utils"

function isGroup(rule: ConditionRule | ConditionGroup): rule is ConditionGroup {
  return "operator" in rule && Array.isArray(rule.rules)
}

type ConditionGroupEditorProps = {
  group: ConditionGroup
  onChange: (group: ConditionGroup) => void
  depth?: number
  invalidRuleIndexes?: number[]
}

export function ConditionGroupEditor({
  group,
  onChange,
  depth = 0,
  invalidRuleIndexes = [],
}: ConditionGroupEditorProps) {
  const rules = group.rules.filter((r): r is ConditionRule => !isGroup(r))

  const updateRule = (index: number, rule: ConditionRule) => {
    const next = [...group.rules]
    next[index] = rule
    onChange({ ...group, rules: next })
  }

  const removeRule = (index: number) => {
    onChange({ ...group, rules: group.rules.filter((_, i) => i !== index) })
  }

  const addRule = () => {
    onChange({
      ...group,
      rules: [
        ...group.rules,
        {
          field: "user.metadata.plan",
          op: "eq",
          value: "pro",
        },
      ],
    })
  }

  const addNestedGroup = () => {
    onChange({
      ...group,
      rules: [
        ...group.rules,
        { operator: "or", rules: [] } satisfies ConditionGroup,
      ],
    })
  }

  const toggleOperator = () => {
    onChange({
      ...group,
      operator: group.operator === "and" ? "or" : "and",
    })
  }

  return (
    <div
      className={cn(
        "space-y-3",
        depth > 0 && "ml-4 rounded-2xl border border-dashed border-violet-500/25 p-4"
      )}
    >
      {depth === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-flow-muted">
            Match users who meet{" "}
            <button
              type="button"
              onClick={toggleOperator}
              className="rounded-md bg-violet-500/20 px-2 py-0.5 font-semibold uppercase text-violet-300 transition-colors hover:bg-violet-500/30"
            >
              {group.operator === "and" ? "all" : "any"}
            </button>{" "}
            of these conditions
          </p>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {group.rules.map((item, index) => {
          if (isGroup(item)) {
            return (
              <ConditionGroupEditor
                key={`group-${index}`}
                group={item}
                depth={depth + 1}
                onChange={(nested) => {
                  const next = [...group.rules]
                  next[index] = nested
                  onChange({ ...group, rules: next })
                }}
              />
            )
          }
          return (
            <ConditionRow
              key={`rule-${index}-${item.field}`}
              rule={item}
              index={index}
              onChange={(r) => updateRule(index, r)}
              onRemove={() => removeRule(index)}
              invalid={invalidRuleIndexes.includes(index)}
            />
          )
        })}
      </AnimatePresence>

      {rules.length === 0 && depth === 0 && (
        <div className="rounded-2xl border border-dashed border-flow-glass px-6 py-10 text-center">
          <p className="text-sm text-flow-muted">
            No conditions yet — everyone matching the trigger will be eligible.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition-colors hover:bg-violet-500/20"
        >
          <Plus className="h-4 w-4" />
          Add condition
        </button>
        {depth < 2 && (
          <button
            type="button"
            onClick={addNestedGroup}
            className="inline-flex items-center gap-2 rounded-xl border border-flow-glass px-4 py-2 text-sm text-flow-muted transition-colors hover:text-flow"
          >
            <Layers className="h-4 w-4" />
            Add OR group
          </button>
        )}
      </div>
    </div>
  )
}
