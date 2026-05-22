import type {
  ConditionGroup,
  ConditionRule,
  EndUser,
} from "@/lib/types/database"

type EvalContext = {
  payload: Record<string, unknown>
  user: EndUser | null
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
    { payload: ctx.payload, user: ctx.user ?? {} },
    field
  )
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
    case "gt":
      return Number(actual) > Number(rule.value)
    case "gte":
      return Number(actual) >= Number(rule.value)
    case "lt":
      return Number(actual) < Number(rule.value)
    case "lte":
      return Number(actual) <= Number(rule.value)
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(actual)
    case "not_in":
      return Array.isArray(rule.value) && !rule.value.includes(actual)
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

  const results = rules.map((r) => evaluateRule(r, ctx))
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
    rules: Array.isArray(g.rules) ? g.rules : [],
  }
}
