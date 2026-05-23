"use client"

import { memo, type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type GlassCardProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
  glow?: boolean
}

function GlassCardBase({ className, children, glow = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-panel relative overflow-hidden rounded-2xl transform-gpu transition-[border-color,background-color,box-shadow] duration-150",
        glow && "glass-panel-glow",
        className
      )}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}

export const GlassCard = memo(GlassCardBase)
