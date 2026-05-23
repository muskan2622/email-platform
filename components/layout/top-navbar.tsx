import { Bell, Command, Search } from "lucide-react"
import { GlowPulse } from "@/components/motion/glow-pulse"
import { NewAutomationButton } from "@/components/layout/new-automation-button"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function TopNavbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="glass-panel sticky top-0 z-30 mb-6 flex animate-in fade-in slide-in-from-top-2 items-center justify-between gap-4 rounded-2xl px-4 py-3 duration-150 md:px-6">
      <div className="relative z-[1]">
        <h1 className="text-xl font-semibold tracking-tight text-flow md:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-flow-muted">{subtitle}</p>}
      </div>

      <div className="relative z-[1] flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <div className="hidden md:block">
          <NewAutomationButton className="!py-2 !text-xs" />
        </div>

      </div>
    </header>
  )
}
