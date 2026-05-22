"use client"

import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { useEffect } from "react"

export function SpotlightCursor() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const background = useMotionTemplate`radial-gradient(600px circle at ${x}px ${y}px, rgba(99,102,241,0.08), transparent 60%)`

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("mousemove", move, { passive: true })
    return () => window.removeEventListener("mousemove", move)
  }, [x, y])

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background }}
      aria-hidden
    />
  )
}
