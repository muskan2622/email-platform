import type { ConditionGroup } from "@/lib/types/database"

export function conditionSummary(conditions: ConditionGroup): string {
  const rules = conditions?.rules ?? []
  if (rules.length === 0) return "All matching events pass"
  return rules
    .map((rule) =>
      "rules" in rule
        ? `(${conditionSummary(rule)})`
        : `${rule.field} ${rule.op} ${String(rule.value ?? "")}`
    )
    .join(`\n${conditions.operator.toUpperCase()}\n`)
}

export function formatDelayLabel(minutes: number, sendImmediately: boolean): string {
  if (sendImmediately || minutes <= 0) return "Send immediately (test: instant)"
  if (minutes < 60) return `Wait ${minutes} minute${minutes === 1 ? "" : "s"}`
  const hours = Math.round((minutes / 60) * 10) / 10
  return `Wait ${hours} hour${hours === 1 ? "" : "s"}`
}

export function formatFrequencyLabel(
  sendOnce: boolean,
  mode: string,
  cooldownDays: number
): string {
  if (sendOnce || mode === "once_per_user") return "Send once per user"
  if (mode === "cooldown" && cooldownDays > 0) {
    return `${cooldownDays} day cooldown between sends`
  }
  return "Every matching event"
}
