"use client"

import { motion } from "framer-motion"
import { Bell, Command, Search } from "lucide-react"
import { MagneticButton } from "@/components/motion/magnetic-button"
import { GlowPulse } from "@/components/motion/glow-pulse"

export function TopNavbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 mb-6 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 backdrop-blur-xl md:px-6"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-white/45">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/50 transition-colors hover:border-white/15 hover:text-white/70 sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/40">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:text-white"
        >
          <Command className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/60 transition-colors hover:text-white"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2">
            <GlowPulse color="violet" />
          </span>
        </button>
        <div className="hidden md:block">
          <MagneticButton className="!py-2 !text-xs">New automation</MagneticButton>
        </div>
      </div>
    </motion.header>
  )
}
