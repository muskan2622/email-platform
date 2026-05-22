"use client"

import { memo, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
}

function MagneticButtonBase({ children, className, onClick }: MagneticButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative transform-gpu overflow-hidden rounded-xl px-5 py-2.5 text-sm font-medium text-white",
        "bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500",
        "shadow-[0_0_30px_-10px_rgba(99,102,241,0.58)]",
        "transition-[transform,box-shadow,filter] duration-100 ease-out hover:-translate-y-0.5 hover:shadow-[0_0_34px_-10px_rgba(99,102,241,0.78)] active:translate-y-0 active:scale-[0.98]",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}

export const MagneticButton = memo(MagneticButtonBase)
