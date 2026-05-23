"use client"

import { Beaker } from "lucide-react"
import { GlassCard } from "@/components/motion/glass-card"
import { cn } from "@/lib/utils"
import type { ExecutionLogEntry } from "@/lib/workflow/types"

export function ExecutionDebugger({
  logs,
  running,
  onLogClick,
  focusedNodeId,
}: {
  logs: ExecutionLogEntry[]
  running: boolean
  onLogClick?: (nodeId: string) => void
  focusedNodeId?: string | null
}) {
  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-flow">Execution Debugger</h3>
        <Beaker className={cn("h-4 w-4 text-amber-300", running && "animate-pulse")} />
      </div>
      <div className="max-h-[280px] space-y-2 overflow-y-auto text-xs">
        {logs.length === 0 ? (
          <p className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-4 text-flow-muted">
            {running
              ? "Executing workflow…"
              : "Run a test to stream live execution logs."}
          </p>
        ) : (
          logs.map((log) => (
            <button
              key={log.id}
              type="button"
              onClick={() => onLogClick?.(log.node_id)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition",
                focusedNodeId === log.node_id
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-flow-glass-faint bg-flow-glass-subtle hover:border-flow-glass-hover"
              )}
            >
              <span
                className={cn(
                  "text-flow-secondary",
                  log.level === "success" && "text-emerald-200",
                  log.level === "warn" && "text-amber-200",
                  log.level === "error" && "text-rose-200"
                )}
              >
                {log.message}
              </span>
              <span className="shrink-0 font-mono text-cyan-200">{log.duration_ms}ms</span>
            </button>
          ))
        )}
      </div>
    </GlassCard>
  )
}
