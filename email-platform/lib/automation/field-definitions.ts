import type { ConditionOperator } from "@/lib/types/database"

export type FieldValueType = "string" | "number" | "boolean" | "date" | "select"

export interface FieldDefinition {
  field: string
  label: string
  description?: string
  valueType: FieldValueType
  operators: ConditionOperator[]
  options?: { value: string; label: string }[]
}

/** Human-facing fields mapped to engine field paths */
export const CONDITION_FIELDS: FieldDefinition[] = [
  {
    field: "user.metadata.plan",
    label: "User plan",
    valueType: "select",
    operators: ["eq", "neq", "in", "not_in"],
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
      { value: "enterprise", label: "Enterprise" },
    ],
  },
  {
    field: "user.metadata.country",
    label: "Country",
    valueType: "select",
    operators: ["eq", "neq", "in", "not_in"],
    options: [
      { value: "US", label: "United States" },
      { value: "IN", label: "India" },
      { value: "GB", label: "United Kingdom" },
      { value: "DE", label: "Germany" },
    ],
  },
  {
    field: "user.unsubscribed_product",
    label: "Product email subscription",
    description: "Whether the user receives product marketing emails",
    valueType: "boolean",
    operators: ["eq"],
    options: [
      { value: "false", label: "Subscribed to product emails" },
      { value: "true", label: "Unsubscribed from product emails" },
    ],
  },
  {
    field: "user.metadata.marketing_opt_in",
    label: "Marketing subscription",
    valueType: "boolean",
    operators: ["eq"],
    options: [
      { value: "true", label: "Opted in to marketing" },
      { value: "false", label: "Opted out of marketing" },
    ],
  },
  {
    field: "payload.order_total",
    label: "Order total",
    valueType: "number",
    operators: ["eq", "neq", "gt", "gte", "lt", "lte"],
  },
  {
    field: "payload.product_name",
    label: "Product name",
    valueType: "string",
    operators: ["eq", "neq", "contains"],
  },
  {
    field: "user.created_at",
    label: "Account created",
    valueType: "date",
    operators: ["date_before", "date_after"],
  },
]

export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  eq: "is",
  neq: "is not",
  contains: "contains",
  regex: "matches pattern",
  gt: "is greater than",
  gte: "is at least",
  lt: "is less than",
  lte: "is at most",
  between: "is between",
  in: "is one of",
  not_in: "is not one of",
  in_array: "includes",
  date_before: "is before",
  date_after: "is after",
  date_between: "is between dates",
  exists: "exists",
  not_exists: "does not exist",
}

export function getFieldDefinition(field: string) {
  return CONDITION_FIELDS.find((f) => f.field === field)
}
