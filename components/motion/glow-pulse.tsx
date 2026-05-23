"use client"

import { memo } from "react"
import { cn } from "@/lib/utils"

function GlowPulseBase({
  className,
  color = "emerald",
}: {
  className?: string
  color?: "emerald" | "cyan" | "violet" | "rose"
}) {
  const colors = {
    emerald: "bg-emerald-400 shadow-emerald-400/80",
    cyan: "bg-cyan-400 shadow-cyan-400/80",
    violet: "bg-violet-400 shadow-violet-400/80",
    rose: "bg-rose-400 shadow-rose-400/80",
  }

  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span className={cn("flow-pulse absolute inline-flex h-full w-full rounded-full", colors[color])} />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full shadow-[0_0_8px]", colors[color])} />
    </span>
  )
}

export const GlowPulse = memo(GlowPulseBase)
