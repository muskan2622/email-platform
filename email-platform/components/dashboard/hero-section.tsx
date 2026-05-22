"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Mail, Zap } from "lucide-react"
import Link from "next/link"
import { MagneticButton } from "@/components/motion/magnetic-button"
import { GlassCard } from "@/components/motion/glass-card"
import { GlowPulse } from "@/components/motion/glow-pulse"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"

export function HeroSection() {
  const { data, loading } = usePlatformDataContext()

  return (
    <GlassCard glow className="relative overflow-hidden p-6 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-[80px]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200"
          >
            <GlowPulse color="violet" />
            Connected to Supabase
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl font-semibold tracking-tight text-white md:text-5xl md:leading-[1.1]"
          >
            Automate every inbox
            <span className="block bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">
              with live platform data
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-4 max-w-lg text-base text-white/50"
          >
            {data?.templates.length ?? 0} templates · {data?.activeTriggers ?? 0} active triggers ·{" "}
            {data?.eventsCount ?? 0} events in stream
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link href="/rules">
              <MagneticButton>View triggers</MagneticButton>
            </Link>
            <Link href="/events">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
              >
                Event monitor
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          {[
            {
              icon: Mail,
              label: "Sent today",
              value: loading ? "…" : String(data?.sentToday ?? 0),
            },
            {
              icon: Zap,
              label: "Events loaded",
              value: loading ? "…" : String(data?.eventsCount ?? 0),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="min-w-[120px] rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3 backdrop-blur-md"
            >
              <stat.icon className="mb-2 h-4 w-4 text-cyan-400" />
              <p className="text-lg font-semibold tabular-nums text-white">{stat.value}</p>
              <p className="text-[11px] text-white/40">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </GlassCard>
  )
}
