"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"
import { useRef, type ReactNode } from "react"

type MagneticButtonProps = {
  children: ReactNode
  className?: string
  onClick?: () => void
  strength?: number
}

export function MagneticButton({
  children,
  className,
  onClick,
  strength = 0.35,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * strength)
    y.set((e.clientY - cy) * strength)
  }

  const handleLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-5 py-2.5 text-sm font-medium text-white",
        "bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500",
        "shadow-[0_0_40px_-8px_rgba(99,102,241,0.6)]",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-100",
        "transition-shadow duration-300 hover:shadow-[0_0_50px_-6px_rgba(99,102,241,0.8)]",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
