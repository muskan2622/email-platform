import type { LucideIcon } from "lucide-react"

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
