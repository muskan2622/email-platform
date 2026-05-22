"use client"

import { motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme, mounted } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative flex h-9 w-[4.25rem] shrink-0 items-center rounded-full border p-0.5",
        "border-flow-glass bg-flow-glass-subtle transition-[box-shadow,background-color,border-color]",
        "hover:border-flow-glass-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--flow-accent)]/40",
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        className={cn(
          "absolute top-0.5 h-7 w-7 rounded-full shadow-sm",
          "bg-gradient-to-br from-[var(--flow-accent)] to-[var(--flow-accent-secondary)]",
          isDark ? "left-[calc(100%-2rem)]" : "left-0.5"
        )}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-2">
        <Sun
          className={cn(
            "h-3.5 w-3.5 transition-colors duration-300",
            !mounted || isDark ? "text-flow-faint" : "text-white"
          )}
        />
        <Moon
          className={cn(
            "h-3.5 w-3.5 transition-colors duration-300",
            !mounted || !isDark ? "text-flow-faint" : "text-white"
          )}
        />
      </span>
    </button>
  )
}
