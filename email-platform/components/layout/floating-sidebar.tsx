"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  FileCode2,
  GitBranch,
  LayoutDashboard,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { springSmooth } from "@/lib/motion"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: FileCode2 },
  { href: "/rules", label: "Rules", icon: GitBranch },
  { href: "/events", label: "Events", icon: Zap },
  { href: "/logs", label: "Email Logs", icon: Mail },
]

export function FloatingSidebar() {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={springSmooth}
      className="group/sidebar glass-panel fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[72px] flex-col p-3 md:flex lg:w-[220px] lg:p-4"
    >
      <div className="relative z-[1] mb-8 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-[0_0_24px_-4px_rgba(139,92,246,0.5)]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="hidden overflow-hidden lg:block">
          <p className="truncate text-sm font-semibold tracking-tight text-flow">Pulsemail</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-flow-faint">AI Engine</p>
        </div>
      </div>

      <nav className="relative z-[1] flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="relative">
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-500/20 to-cyan-500/10 shadow-[inset_0_0_20px_rgba(99,102,241,0.15)] dark:shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]"
                  transition={springSmooth}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active ? "text-flow" : "text-flow-muted hover:text-flow-secondary"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-violet-500 dark:text-violet-300")} />
                <span className="hidden truncate lg:inline">{item.label}</span>
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="relative z-[1] mt-auto rounded-xl border border-flow-glass-faint bg-flow-glass-subtle p-3">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="hidden text-xs text-flow-muted lg:inline">All systems live</span>
        </div>
        <div className="mt-2 hidden h-1 overflow-hidden rounded-full bg-flow-glass-inset lg:block">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
            initial={{ width: "0%" }}
            animate={{ width: "94%" }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
        </div>
      </div>
    </motion.aside>
  )
}
