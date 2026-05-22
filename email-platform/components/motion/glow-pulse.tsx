"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function GlowPulse({ className, color = "emerald" }: { className?: string; color?: "emerald" | "cyan" | "violet" | "rose" }) {
  const colors = {
    emerald: "bg-emerald-400 shadow-emerald-400/80",
    cyan: "bg-cyan-400 shadow-cyan-400/80",
    violet: "bg-violet-400 shadow-violet-400/80",
    rose: "bg-rose-400 shadow-rose-400/80",
  }
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <motion.span
        className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", colors[color])}
        animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full shadow-[0_0_8px]", colors[color])} />
    </span>
  )
}
