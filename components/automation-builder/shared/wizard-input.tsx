"use client"

import { cn } from "@/lib/utils"

export function WizardInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-flow-glass bg-flow-glass-subtle px-4 py-2.5 text-sm text-flow outline-none transition-colors",
        "placeholder:text-flow-faint focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20",
        className
      )}
      {...props}
    />
  )
}

export function WizardSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-flow-glass bg-flow-glass-subtle px-4 py-2.5 text-sm text-flow outline-none transition-colors",
        "focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20",
        className
      )}
      {...props}
    />
  )
}

export function WizardLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-xs font-medium uppercase tracking-wider text-flow-muted", className)}>
      {children}
    </label>
  )
}
