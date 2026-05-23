import { SkeletonShimmer } from "@/components/motion/skeleton-shimmer"

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonShimmer key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}
