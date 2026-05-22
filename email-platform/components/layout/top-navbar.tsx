import { Bell, Command, Search } from "lucide-react"
import { MagneticButton } from "@/components/motion/magnetic-button"
import { GlowPulse } from "@/components/motion/glow-pulse"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function TopNavbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="glass-panel sticky top-0 z-30 mb-6 flex animate-in fade-in slide-in-from-top-2 items-center justify-between gap-4 rounded-2xl px-4 py-3 duration-150 md:px-6">
      <div className="relative z-[1]">
        <h1 className="text-xl font-semibold tracking-tight text-flow md:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-flow-muted">{subtitle}</p>}
      </div>

      <div className="relative z-[1] flex items-center gap-2 md:gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-xl border border-flow-glass bg-flow-glass-subtle px-3 py-2 text-sm text-flow-muted transition-colors hover:border-flow-glass-hover hover:text-flow-secondary sm:flex"
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="rounded-md border border-flow-glass-faint bg-flow-glass-subtle px-1.5 py-0.5 font-mono text-[10px] text-flow-faint">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-flow-glass bg-flow-glass-subtle text-flow-muted transition-colors hover:text-flow"
        >
          <Command className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-flow-glass bg-flow-glass-subtle text-flow-muted transition-colors hover:text-flow"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2">
            <GlowPulse color="violet" />
          </span>
        </button>
        <ThemeToggle />
        <div className="hidden md:block">
          <MagneticButton className="!py-2 !text-xs">New automation</MagneticButton>
        </div>
      </div>
    </header>
  )
}
