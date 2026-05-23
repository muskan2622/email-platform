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
