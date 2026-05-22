"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileCode2, GitBranch, LayoutDashboard, Mail, Zap } from "lucide-react"
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

  return (
    <motion.nav
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-2xl border border-white/10 bg-black/60 p-1.5 backdrop-blur-2xl md:hidden"
    >
      {dock.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <motion.span
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                active
                  ? "bg-gradient-to-b from-violet-500/30 to-cyan-500/20 text-white shadow-[0_0_20px_-4px_rgba(99,102,241,0.5)]"
                  : "text-white/50"
              )}
            >
              <Icon className="h-5 w-5" />
            </motion.span>
          </Link>
        )
      })}
    </motion.nav>
  )
}
