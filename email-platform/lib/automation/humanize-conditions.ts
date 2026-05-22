import { getFieldDefinition, OPERATOR_LABELS } from "@/lib/automation/field-definitions"
import type { ConditionGroup, ConditionRule } from "@/lib/types/database"

function isGroup(rule: ConditionRule | ConditionGroup): rule is ConditionGroup {
  return "operator" in rule && Array.isArray(rule.rules)
}

function formatValue(field: string, value: unknown): string {
  const def = getFieldDefinition(field)
  if (def?.valueType === "boolean" && def.options) {
    const opt = def.options.find((o) => o.value === String(value))
    if (opt) return opt.label
  }
  if (def?.options) {
    const opt = def.options.find((o) => o.value === String(value))
    if (opt) return opt.label
  }
  if (Array.isArray(value)) return value.join(", ")
  return String(value ?? "")
}

export function humanizeRule(rule: ConditionRule): string {
  const def = getFieldDefinition(rule.field)
  const fieldLabel = def?.label ?? rule.field
  const opLabel = OPERATOR_LABELS[rule.op] ?? rule.op
  const valueLabel = formatValue(rule.field, rule.value)
  return `${fieldLabel} ${opLabel} ${valueLabel}`.trim()
}

export function humanizeConditionGroup(
  group: ConditionGroup,
  depth = 0
): string[] {
  const lines: string[] = []
  const joiner = group.operator === "or" ? "OR" : "AND"

  for (const item of group.rules) {
    if (isGroup(item)) {
      const nested = humanizeConditionGroup(item, depth + 1)
      if (nested.length) {
        lines.push(...nested.map((l, i) => (i === 0 && lines.length ? `${joiner} ` : "") + l))
      }
    } else if (item.field) {
      const prefix = lines.length ? `${joiner} ` : ""
      lines.push(`${prefix}${humanizeRule(item)}`)
    }
  }
  return lines
}
