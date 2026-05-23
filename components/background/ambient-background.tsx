"use client"

import { memo } from "react"

function AmbientBackgroundBase() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden theme-transition" aria-hidden>
      <div
        className="absolute inset-0 theme-transition"
        style={{
          background: "linear-gradient(165deg, var(--flow-page-bg) 0%, var(--flow-page-bg-end) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(var(--flow-grid) 1px, transparent 1px), linear-gradient(90deg, var(--flow-grid) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
        }}
      />
      <div className="flow-ambient flow-ambient-a" />
      <div className="flow-ambient flow-ambient-b" />
      <div
        className="absolute inset-0 theme-transition"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, transparent 62%, var(--flow-page-bg-end) 100%)",
        }}
      />
    </div>
  )
}

export const AmbientBackground = memo(AmbientBackgroundBase)
