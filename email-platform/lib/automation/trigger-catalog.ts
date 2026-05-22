import {
  ArrowUpCircle,
  CreditCard,
  KeyRound,
  Package,
  Receipt,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

export type TriggerCategory = "users" | "billing" | "commerce" | "security" | "product"

export interface TriggerDefinition {
  id: string
  event: string
  label: string
  description: string
  category: TriggerCategory
  icon: LucideIcon
  realtime: boolean
  samplePayload?: Record<string, unknown>
}

export const TRIGGER_CATEGORIES: Record<TriggerCategory, string> = {
  users: "User lifecycle",
  billing: "Billing & plans",
  commerce: "Orders & invoices",
  security: "Security",
  product: "Product usage",
}

export const TRIGGER_CATALOG: TriggerDefinition[] = [
  {
    id: "user-signup",
    event: "user.signup",
    label: "User signed up",
    description: "Fires when a new account is created in your product.",
    category: "users",
    icon: UserPlus,
    realtime: true,
  },
  {
    id: "user-plan-upgraded",
    event: "user.plan_upgraded",
    label: "Plan upgraded",
    description: "User moved to a higher tier or paid plan.",
    category: "billing",
    icon: ArrowUpCircle,
    realtime: true,
  },
  {
    id: "order-completed",
    event: "order.completed",
    label: "Order completed",
    description: "Checkout succeeded and the order is confirmed.",
    category: "commerce",
    icon: Package,
    realtime: true,
  },
  {
    id: "invoice-failed",
    event: "invoice.failed",
    label: "Invoice payment failed",
    description: "A recurring charge or invoice could not be collected.",
    category: "billing",
    icon: CreditCard,
    realtime: true,
  },
  {
    id: "password-reset",
    event: "password.reset_requested",
    label: "Password reset requested",
    description: "User asked to reset their password.",
    category: "security",
    icon: KeyRound,
    realtime: false,
  },
  {
    id: "subscription-cancelled",
    event: "subscription.cancelled",
    label: "Subscription cancelled",
    description: "User cancelled their subscription or trial ended.",
    category: "billing",
    icon: Receipt,
    realtime: true,
  },
  {
    id: "trial-started",
    event: "trial.started",
    label: "Trial started",
    description: "User began a free trial period.",
    category: "product",
    icon: ArrowUpCircle,
    realtime: true,
  },
  {
    id: "feature-used",
    event: "feature.used",
    label: "Feature used",
    description: "User completed a key product action.",
    category: "product",
    icon: Package,
    realtime: true,
  },
]

export function findTrigger(event: string) {
  return TRIGGER_CATALOG.find((t) => t.event === event)
}
