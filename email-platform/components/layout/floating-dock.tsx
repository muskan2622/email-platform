"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileCode2, GitBranch, LayoutDashboard, Mail, Plus, Zap } from "lucide-react"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"
import { cn } from "@/lib/utils"

const dock = [
  { href: "/", icon: LayoutDashboard },
  { href: "/templates", icon: FileCode2 },
  { href: "/rules", icon: GitBranch },
  { href: "/events", icon: Zap },
  { href: "/logs", icon: Mail },
]

export function FloatingDock() {
  const pathname = usePathname()
  const openWizard = useAutomationWizardStore((s) => s.openWizard)

  return (
    <nav
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 gap-1 rounded-2xl border border-flow-glass p-1.5 backdrop-blur-xl duration-150 md:hidden theme-transition"
      style={{ backgroundColor: "var(--flow-dock-bg)" }}
    >
      <button
        type="button"
        onClick={() => openWizard(1)}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.6)]"
        aria-label="New automation"
      >
        <Plus className="h-5 w-5" />
      </button>
      {dock.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <span
              className={cn(
                "flex h-11 w-11 transform-gpu items-center justify-center rounded-xl transition-[background-color,color,transform] duration-100 active:scale-95",
                active
                  ? "bg-gradient-to-b from-violet-500/30 to-cyan-500/20 text-flow shadow-[0_0_20px_-4px_rgba(99,102,241,0.5)]"
                  : "text-flow-muted"
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
