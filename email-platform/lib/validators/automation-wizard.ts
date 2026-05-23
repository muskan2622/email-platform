import { z } from "zod"
import { DEFAULT_DELIVERY_RULES } from "@/lib/types/automation"
import type { ConditionGroup } from "@/lib/types/database"

const conditionOperators = [
  "eq", "neq", "contains", "regex", "gt", "gte", "lt", "lte",
  "between", "in", "not_in", "in_array", "date_before", "date_after",
  "date_between", "exists", "not_exists",
] as const

const conditionRuleSchema = z.object({
  field: z.string().min(1),
  op: z.enum(conditionOperators),
  value: z.unknown().optional(),
})

const conditionGroupSchema: z.ZodTypeAny = z.lazy(() =>
  z.object({
    operator: z.enum(["and", "or"]),
    rules: z.array(z.union([conditionRuleSchema, conditionGroupSchema])),
  })
)

export const deliveryRulesSchema = z.object({
  mode: z.enum(["every_trigger", "once_per_user", "cooldown"]),
  delay_minutes: z.number().min(0).max(60 * 24 * 30),
  cooldown_days: z.number().min(0).max(365),
  max_sends_per_user: z.number().nullable(),
  send_immediately: z.boolean(),
})

const optionalTemplateId = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().uuid("Select an email template").optional()
)

export const automationDraftSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  trigger_event: z.string().min(1, "Select a trigger event"),
  conditions: conditionGroupSchema,
  template_id: optionalTemplateId,
  delivery_rules: deliveryRulesSchema,
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
})

export const automationWizardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  trigger_event: z.string().min(1, "Select a trigger event"),
  conditions: conditionGroupSchema,
  template_id: z.string().uuid("Select an email template"),
  delivery_rules: deliveryRulesSchema,
  status: z.enum(["draft", "active", "paused", "archived"]).default("draft"),
})

export type AutomationWizardFormValues = z.infer<typeof automationWizardSchema>
export type AutomationDraftFormValues = z.infer<typeof automationDraftSchema>

export const triggerStepSchema = automationWizardSchema.pick({ trigger_event: true })
export const conditionsStepSchema = automationWizardSchema.pick({ conditions: true })
export const templateStepSchema = z.object({
  template_id: z.string().uuid("Select an email template"),
})
export const deliveryStepSchema = automationWizardSchema.pick({ delivery_rules: true })

export const WIZARD_STEPS = [
  { id: 1, key: "trigger", title: "Trigger", subtitle: "When should this run?" },
  { id: 2, key: "conditions", title: "Conditions", subtitle: "Who should receive it?" },
  { id: 3, key: "template", title: "Template", subtitle: "What email to send?" },
  { id: 4, key: "delivery", title: "Delivery", subtitle: "How often to send?" },
  { id: 5, key: "review", title: "Review", subtitle: "Confirm and activate" },
] as const

const EMPTY_CONDITIONS: ConditionGroup = { operator: "and", rules: [] }

export function defaultWizardValues(): AutomationWizardFormValues {
  return {
    name: "",
    description: "",
    trigger_event: "",
    conditions: EMPTY_CONDITIONS,
    template_id: "",
    delivery_rules: { ...DEFAULT_DELIVERY_RULES },
    status: "draft",
  }
}
