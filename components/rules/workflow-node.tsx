"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import {
  CalendarClock,
  Filter,
  Flag,
  Hourglass,
  Mail,
  ShieldCheck,
  Split,
  Target,
  Webhook,
  Workflow,
  Zap,
} from "lucide-react"
import { memo } from "react"
import { cn } from "@/lib/utils"
import type {
  WorkflowGraphNodeData,
  WorkflowNodeKind,
} from "@/lib/workflow/types"

export type WorkflowGraphNode = {
  id: string
  type: "workflow"
  position: { x: number; y: number }
  data: WorkflowGraphNodeData
}

function nodeTone(kind: WorkflowNodeKind) {
  switch (kind) {
    case "trigger":
      return "border-amber-400/45 bg-amber-400/10 text-amber-100 shadow-amber-500/20"
    case "condition":
      return "border-violet-400/45 bg-violet-400/10 text-violet-100 shadow-violet-500/20"
    case "frequency":
      return "border-emerald-400/45 bg-emerald-400/10 text-emerald-100 shadow-emerald-500/20"
    case "delay":
    case "wait":
      return "border-sky-400/45 bg-sky-400/10 text-sky-100 shadow-sky-500/20"
    case "branch":
      return "border-fuchsia-400/45 bg-fuchsia-400/10 text-fuchsia-100 shadow-fuchsia-500/20"
    case "send":
      return "border-cyan-400/45 bg-cyan-400/10 text-cyan-100 shadow-cyan-500/20"
    case "webhook":
      return "border-orange-400/45 bg-orange-400/10 text-orange-100 shadow-orange-500/20"
    case "goal":
      return "border-lime-400/45 bg-lime-400/10 text-lime-100 shadow-lime-500/20"
    case "exit":
      return "border-slate-400/45 bg-slate-400/10 text-slate-100 shadow-slate-500/20"
    default:
      return "border-flow-glass bg-flow-glass text-flow"
  }
}

function WorkflowNodeIcon({ kind }: { kind: WorkflowNodeKind }) {
  switch (kind) {
    case "trigger":
      return <Zap className="h-5 w-5" />
    case "condition":
      return <Filter className="h-5 w-5" />
    case "frequency":
      return <ShieldCheck className="h-5 w-5" />
    case "delay":
      return <Hourglass className="h-5 w-5" />
    case "wait":
      return <CalendarClock className="h-5 w-5" />
    case "branch":
      return <Split className="h-5 w-5" />
    case "send":
      return <Mail className="h-5 w-5" />
    case "webhook":
      return <Webhook className="h-5 w-5" />
    case "goal":
      return <Target className="h-5 w-5" />
    case "exit":
      return <Flag className="h-5 w-5" />
    default:
      return <Workflow className="h-5 w-5" />
  }
}

export const WorkflowFlowNode = memo(function WorkflowFlowNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as WorkflowGraphNodeData
  const isRunning = nodeData.status === "running"
  const isSuccess = nodeData.status === "success"
  const isFailure = nodeData.status === "failure"
  const isSkipped = nodeData.status === "skipped"

  return (
    <div
      className={cn(
        "min-w-[220px] rounded-2xl border p-4 shadow-[0_0_45px_-18px] backdrop-blur-md transition-all duration-300",
        nodeTone(nodeData.kind),
        selected && "ring-2 ring-cyan-300/50",
        isRunning && "animate-pulse ring-2 ring-cyan-400/60 scale-[1.02]",
        isSuccess && "ring-2 ring-emerald-400/50 shadow-emerald-500/30",
        isFailure && "ring-2 ring-rose-400/50 shadow-rose-500/30",
        isSkipped && "opacity-70"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-cyan-200 !bg-slate-950"
      />
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/25">
          <WorkflowNodeIcon kind={nodeData.kind} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-flow">{nodeData.label}</p>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase text-flow-faint">
              {nodeData.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-flow-muted">{nodeData.subtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
        <span className="text-flow-faint">Metric</span>
        <span className="font-mono text-cyan-200">{nodeData.metric}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-cyan-200 !bg-cyan-300"
      />
    </div>
  )
})

export const workflowNodeTypes = { workflow: WorkflowFlowNode }
