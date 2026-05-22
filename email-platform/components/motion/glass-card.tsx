"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function GlassCard({
  className,
  children,
  glow = false,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode; glow?: boolean }) {
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
