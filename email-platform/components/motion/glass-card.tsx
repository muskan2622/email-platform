"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

export function GlassCard({
  className,
  children,
  glow = false,
  ...props
}: HTMLMotionProps<"div"> & { glow?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        "shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]",
        glow && "shadow-[0_0_60px_-20px_rgba(99,102,241,0.25)]",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/[0.06] before:to-transparent",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
