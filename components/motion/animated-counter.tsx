"use client"

import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: number
  suffix?: string
  className?: string
}) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return (
    <span className={className}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}
