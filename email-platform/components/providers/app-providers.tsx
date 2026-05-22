"use client"

import { MotionConfig } from "framer-motion"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      {children}
    </MotionConfig>
  )
}
