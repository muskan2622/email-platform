import {
  ArrowUpCircle,
  CreditCard,
  KeyRound,
  Package,
  Receipt,
  UserPlus,
  Zap,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  ArrowUpCircle,
  CreditCard,
  KeyRound,
  Package,
  Receipt,
  UserPlus,
  Zap,
}

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Zap
  return ICON_MAP[name] ?? Zap
}
