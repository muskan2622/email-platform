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
        "glass-panel relative overflow-hidden rounded-2xl",
        glow && "glass-panel-glow",
        className
      )}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </motion.div>
  )
}
