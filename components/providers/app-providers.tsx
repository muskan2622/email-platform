"use client"

import { MotionConfig } from "framer-motion"
import { ThemeProvider } from "@/components/providers/theme-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        {children}
      </MotionConfig>
    </ThemeProvider>
  )
}
