"use client"

import { CheckCircle2, Route, XCircle } from "lucide-react"
import { GlassCard } from "@/components/motion/glass-card"
import type { WorkflowExecutionResult } from "@/lib/workflow/types"
import type { WorkflowGraphNode } from "@/components/rules/workflow-node"

export function WorkflowInspector({
  node,
  execution,
}: {
  node: WorkflowGraphNode | undefined
  execution: WorkflowExecutionResult | null
}) {
  if (!node) {
    return (
      <GlassCard className="p-4">
        <p className="text-sm text-flow-muted">Select a node to inspect configuration.</p>
      </GlassCard>
    )
  }

  const step = execution?.steps.find((s) => s.node_id === node.id)
  const kind = node.data.kind

  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-flow-faint">Inspector</p>
          <h3 className="text-base font-semibold text-flow">{node.data.label}</h3>
        </div>
        <Route className="h-5 w-5 text-cyan-300" />
      </div>

      <p className="rounded-lg border border-flow-glass-faint bg-flow-glass-inset p-3 text-sm text-flow-secondary">
        {node.data.subtitle}
      </p>

      {step ? (
        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            step.passed
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-rose-400/30 bg-rose-400/10 text-rose-100"
          }`}
        >
          <div className="flex items-center gap-2">
            {step.passed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <span className="font-medium">
              {step.passed ? "Passed" : "Failed"} — {step.reason}
            </span>
            <span className="ml-auto font-mono text-xs">{step.duration_ms}ms</span>
          </div>
          {step.output ? (
            <pre className="mt-2 max-h-32 overflow-auto text-[10px] opacity-90">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}

      {kind === "trigger" && (
        <InspectorSection title="Event schema">
          <p className="font-mono text-xs text-cyan-200">
            {(node.data.config?.event_type as string) ?? "—"}
          </p>
          <p className="mt-2 text-xs text-flow-muted">
            Incoming events must match this type. Payload and user blocks are validated on ingest.
          </p>
        </InspectorSection>
      )}

      {kind === "condition" && (
        <InspectorSection title="Evaluated logic">
          <p className="text-xs text-flow-muted">{node.data.subtitle}</p>
          {step?.output ? (
            <p className="mt-2 font-mono text-xs text-violet-200">
              Result: {(step.output.result as boolean) ? "TRUE" : "FALSE"}
            </p>
          ) : null}
        </InspectorSection>
      )}

      {kind === "send" && (
        <InspectorSection title="Template delivery">
          <p className="text-sm text-flow">{String(node.data.config?.template_name ?? "—")}</p>
          {step?.output ? (
            <p className="mt-1 text-xs text-flow-muted">
              Status: {String(step.output.status ?? "pending")}
              {step.output.to ? ` → ${String(step.output.to)}` : ""}
            </p>
          ) : (
            <p className="text-xs text-flow-muted">Run test to preview delivery state.</p>
          )}
        </InspectorSection>
      )}

      <div className="mt-4 space-y-2">
        {node.data.details.map((detail) => (
          <div key={detail} className="flex items-start gap-2 text-xs text-flow-muted">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {detail}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function InspectorSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-flow-faint">
        {title}
      </p>
      {children}
    </div>
  )
}
