export function EmptyState({
  message,
  hint,
}: {
  message: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-flow-glass-faint bg-flow-glass-subtle px-6 py-12 text-center">
      <p className="text-sm text-flow-muted">{message}</p>
      {hint ? <p className="mt-2 text-xs text-flow-faint">{hint}</p> : null}
    </div>
  )
}
