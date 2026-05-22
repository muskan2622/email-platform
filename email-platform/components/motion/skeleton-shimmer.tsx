"use client"

import { cn } from "@/lib/utils"

export function SkeletonShimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-white/[0.04]",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.5s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-white/10 after:to-transparent",
        className
      )}
    />
  )
}
