import type {
  ConditionGroup,
  ConditionRule,
  EndUser,
} from "@/lib/types/database"

type EvalContext = {
  payload: Record<string, unknown>
  user: EndUser | null
  aggregates?: Record<string, unknown>
  activity?: Record<string, unknown>
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

function resolveField(field: string, ctx: EvalContext): unknown {
  if (field.startsWith("payload.")) {
    return getByPath({ payload: ctx.payload }, field)
  }
  if (field.startsWith("user.")) {
    if (!ctx.user) return undefined
    const userRecord = {
      user: {
        ...ctx.user,
        ...ctx.user.metadata,
        unsubscribed_product: ctx.user.unsubscribed_product,
      },
    }
    return getByPath(userRecord as Record<string, unknown>, field)
  }
  return getByPath(
    {
      payload: ctx.payload,
      user: ctx.user ?? {},
      aggregates: ctx.aggregates ?? {},
      activity: ctx.activity ?? {},
    },
    field
  )
}

function isConditionGroup(rule: ConditionRule | ConditionGroup): rule is ConditionGroup {
  return "operator" in rule && Array.isArray(rule.rules)
}

function isBetween(value: unknown): value is [unknown, unknown] {
  return Array.isArray(value) && value.length === 2
}

function toTime(value: unknown) {
  const time = new Date(String(value)).getTime()
  return Number.isFinite(time) ? time : NaN
}

function evaluateRule(rule: ConditionRule, ctx: EvalContext): boolean {
  const actual = resolveField(rule.field, ctx)

  switch (rule.op) {
    case "exists":
      return actual !== undefined && actual !== null
    case "not_exists":
      return actual === undefined || actual === null
    case "eq":
      return actual === rule.value
    case "neq":
      return actual !== rule.value
    case "contains":
      return String(actual ?? "").toLowerCase().includes(String(rule.value ?? "").toLowerCase())
    case "regex":
      try {
        return new RegExp(String(rule.value)).test(String(actual ?? ""))
      } catch {
        return false
      }
    case "gt":
      return Number(actual) > Number(rule.value)
    case "gte":
      return Number(actual) >= Number(rule.value)
    case "lt":
      return Number(actual) < Number(rule.value)
    case "lte":
      return Number(actual) <= Number(rule.value)
    case "between":
      return isBetween(rule.value) && Number(actual) >= Number(rule.value[0]) && Number(actual) <= Number(rule.value[1])
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual)
    case "not_in":
      return Array.isArray(rule.value) && !rule.value.includes(actual)
    case "in_array":
      return Array.isArray(actual) && actual.includes(rule.value)
    case "date_before":
      return toTime(actual) < toTime(rule.value)
    case "date_after":
      return toTime(actual) > toTime(rule.value)
    case "date_between":
      return isBetween(rule.value) && toTime(actual) >= toTime(rule.value[0]) && toTime(actual) <= toTime(rule.value[1])
    default:
      return false
  }
}

export function evaluateConditions(
  group: ConditionGroup,
  ctx: EvalContext
): boolean {
  const rules = group?.rules ?? []
  if (rules.length === 0) return true

  const results = rules.map((r) =>
    isConditionGroup(r) ? evaluateConditions(r, ctx) : evaluateRule(r, ctx)
  )
  return group.operator === "or"
    ? results.some(Boolean)
    : results.every(Boolean)
}

export function parseConditionGroup(raw: unknown): ConditionGroup {
  if (!raw || typeof raw !== "object") {
    return { operator: "and", rules: [] }
  }
  const g = raw as ConditionGroup
  return {
    operator: g.operator === "or" ? "or" : "and",
    rules: Array.isArray(g.rules)
      ? g.rules.map((rule) => (isConditionGroup(rule) ? parseConditionGroup(rule) : rule))
      : [],
  }
}
