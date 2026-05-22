"use client"

import { motion } from "framer-motion"

export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden theme-transition" aria-hidden>
      <div
        className="absolute inset-0 theme-transition"
        style={{
          background: `linear-gradient(165deg, var(--flow-page-bg) 0%, var(--flow-page-bg-end) 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.35]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />
      <motion.div
        className="absolute -left-[20%] top-[10%] h-[55vh] w-[55vh] rounded-full blur-[120px] theme-transition"
        style={{ backgroundColor: "var(--flow-blob-1)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[15%] top-[30%] h-[50vh] w-[50vh] rounded-full blur-[110px] theme-transition"
        style={{ backgroundColor: "var(--flow-blob-2)" }}
        animate={{ x: [0, -35, 0], y: [0, -25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[5%] left-[25%] h-[45vh] w-[45vh] rounded-full blur-[100px] theme-transition"
        style={{ backgroundColor: "var(--flow-blob-3)" }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-60 dark:opacity-[0.12] theme-transition"
        style={{
          backgroundImage:
            "linear-gradient(var(--flow-grid) 1px, transparent 1px), linear-gradient(90deg, var(--flow-grid) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)",
        }}
      />
      <motion.div
        className="absolute inset-0 theme-transition"
        style={{
          background: `linear-gradient(to bottom, transparent, transparent, var(--flow-page-bg-end))`,
        }}
        animate={{ opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
