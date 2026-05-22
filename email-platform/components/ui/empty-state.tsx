export function EmptyState({
  message,
  hint,
}: {
  message: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <p className="text-sm text-white/60">{message}</p>
      {hint ? <p className="mt-2 text-xs text-white/35">{hint}</p> : null}
    </div>
  )
}
