"use client"

import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { motion } from "framer-motion"
import {
  Activity,
  AlarmClock,
  Beaker,
  Braces,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Code2,
  Filter,
  Flag,
  Globe2,
  Hourglass,
  Loader2,
  Mail,
  Maximize2,
  PauseCircle,
  Play,
  RefreshCw,
  Route,
  Search,
  Send,
  ShieldCheck,
  Split,
  Target,
  TimerReset,
  Users,
  Webhook,
  Workflow,
  X,
  Zap,
} from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { parseConditionGroup } from "@/lib/engine/conditions"
import type { ConditionGroup } from "@/lib/types/database"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { apiPost } from "@/lib/api/client"

type WorkflowNodeKind =
  | "trigger"
  | "condition"
  | "frequency"
  | "delay"
  | "wait"
  | "branch"
  | "send"
  | "webhook"
  | "goal"
  | "exit"

type WorkflowNodeData = {
  label: string
  subtitle: string
  kind: WorkflowNodeKind
  metric: string
  status: "live" | "waiting" | "guarded" | "test" | "done"
  details: string[]
}

type WorkflowGraphNode = Node<WorkflowNodeData, "workflow">

const nodeCatalog: Array<{ kind: WorkflowNodeKind; label: string; icon: typeof Zap }> = [
  { kind: "trigger", label: "Trigger", icon: Zap },
  { kind: "condition", label: "Condition", icon: Filter },
  { kind: "frequency", label: "Frequency Cap", icon: ShieldCheck },
  { kind: "delay", label: "Delay", icon: Hourglass },
  { kind: "wait", label: "Wait Until", icon: CalendarClock },
  { kind: "branch", label: "Branch", icon: Split },
  { kind: "send", label: "Send Template", icon: Mail },
  { kind: "webhook", label: "Webhook", icon: Webhook },
  { kind: "goal", label: "Goal", icon: Target },
  { kind: "exit", label: "Exit", icon: Flag },
]

const eventExamples = [
  "user.signup",
  "user.plan_upgraded",
  "invoice.paid",
  "subscription.cancelled",
  "workspace.invited",
  "usage.threshold_hit",
  "project.created",
  "message.sent",
]

function buildSamplePayload(type: string) {
  return {
    type,
    message_id: `evt_preview_${type.replace(/[^a-z0-9]/gi, "_")}`,
    source: "workflow-simulator",
    timestamp: new Date().toISOString(),
    identifiers: { workspace_id: "ws_123" },
    user: {
      external_id: "user_123",
      email: "alex@example.com",
      metadata: { plan_name: "pro", timezone: "Asia/Calcutta" },
      unsubscribed_product: false,
    },
    payload: { plan_name: "pro", mrr: 99 },
  }
}

type ReplayResult = {
  replay_id: string
  accepted_at: string
  idempotency_key: string
  evaluations: Array<{
    trigger_id: string
    trigger_name: string
    event_type: string
    matched: boolean
    reason: string
    template: { id: string; name: string; status: string } | null
  }>
}

function formatPayload(payload: ReturnType<typeof buildSamplePayload>) {
  return JSON.stringify(payload, null, 2)
}

function conditionSummary(conditions: ConditionGroup): string {
  const rules = conditions?.rules ?? []
  if (rules.length === 0) return "No qualification rules"
  return rules
    .map((rule) =>
      "rules" in rule
        ? `(${conditionSummary(rule)})`
        : `${rule.field} ${rule.op} ${String(rule.value ?? "")}`
    )
    .join(` ${conditions.operator.toUpperCase()} `)
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

const WorkflowNode = memo(function WorkflowNode({ data, selected }: NodeProps<WorkflowGraphNode>) {
  return (
    <div
      className={cn(
        "min-w-[220px] rounded-2xl border p-4 shadow-[0_0_45px_-18px] backdrop-blur-md transition-[border-color,box-shadow,transform] duration-100",
        nodeTone(data.kind),
        selected && "ring-2 ring-cyan-300/50"
      )}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-cyan-200 !bg-slate-950" />
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/25">
          <WorkflowNodeIcon kind={data.kind} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-flow">{data.label}</p>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase text-flow-faint">
              {data.status}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-flow-muted">{data.subtitle}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
        <span className="text-flow-faint">Now</span>
        <span className="font-mono text-cyan-200">{data.metric}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-cyan-200 !bg-cyan-300" />
    </div>
  )
})

const nodeTypes = { workflow: WorkflowNode }
const graphEdgeOptions = { animated: true }
const flowCanvasClass = "workflow-canvas h-full w-full"
const flowControlsClass =
  "!border !border-white/10 !bg-black/45 !shadow-none [&_.react-flow__controls-button]:!border-white/10 [&_.react-flow__controls-button]:!bg-black/60 [&_.react-flow__controls-button]:!text-white [&_.react-flow__controls-button:hover]:!bg-black/80"
const canvasToolbarButtonClass =
  "border-white/10 bg-black/30 text-flow hover:bg-black/45 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/45"

function buildWorkflow(trigger: {
  name: string
  event_type: string
  send_once_per_user: boolean
  conditions: ConditionGroup
  templates: { name: string } | null
}) {
  const condition = conditionSummary(trigger.conditions)
  const nodes: WorkflowGraphNode[] = [
    {
      id: "trigger",
      type: "workflow",
      position: { x: 0, y: 120 },
      data: {
        kind: "trigger",
        label: "Trigger Node",
        subtitle: trigger.event_type,
        metric: "1.8k events",
        status: "live",
        details: ["Validates source, timestamp, identifiers", "Idempotency key: source + message_id", "Replay window: 24 hours"],
      },
    },
    {
      id: "condition",
      type: "workflow",
      position: { x: 310, y: 55 },
      data: {
        kind: "condition",
        label: "Condition Node",
        subtitle: condition,
        metric: "72% pass",
        status: "guarded",
        details: ["Nested AND/OR groups", "Queries payload, user metadata, aggregates", "Supports regex, date, array, range operators"],
      },
    },
    {
      id: "frequency",
      type: "workflow",
      position: { x: 620, y: 55 },
      data: {
        kind: "frequency",
        label: "Frequency Cap",
        subtitle: trigger.send_once_per_user ? "Send once per user + 7d cooldown" : "3 sends / 7 days, quiet hours enforced",
        metric: "42 capped",
        status: "guarded",
        details: ["Suppression lists", "Marketing unsubscribe enforcement", "Race-safe unique delivery lock"],
      },
    },
    {
      id: "delay",
      type: "workflow",
      position: { x: 930, y: 0 },
      data: {
        kind: "delay",
        label: "Delay Node",
        subtitle: "Wait 2 hours after upgrade",
        metric: "318 waiting",
        status: "waiting",
        details: ["BullMQ delayed job or Temporal timer", "Timezone-aware resume", "Dead-letter on expired state"],
      },
    },
    {
      id: "branch",
      type: "workflow",
      position: { x: 930, y: 210 },
      data: {
        kind: "branch",
        label: "Branch / Split",
        subtitle: "A/B 50/50, 10% holdout",
        metric: "3 arms",
        status: "test",
        details: ["Stable bucketing by user id", "Percentage rollout", "Holdout conversion measurement"],
      },
    },
    {
      id: "send",
      type: "workflow",
      position: { x: 1240, y: 55 },
      data: {
        kind: "send",
        label: "Send Template",
        subtitle: trigger.templates?.name ?? "Select template",
        metric: "984 sent",
        status: "live",
        details: ["Resend primary, SendGrid failover", "Retry with exponential backoff", "Open/click/bounce tracking"],
      },
    },
    {
      id: "webhook",
      type: "workflow",
      position: { x: 1550, y: 0 },
      data: {
        kind: "webhook",
        label: "Webhook Node",
        subtitle: "POST lifecycle.updated",
        metric: "99.9%",
        status: "live",
        details: ["Signed outbound webhook", "Idempotency key on request", "Retries to DLQ after final failure"],
      },
    },
    {
      id: "goal",
      type: "workflow",
      position: { x: 1550, y: 210 },
      data: {
        kind: "goal",
        label: "Goal Node",
        subtitle: "Converted to paid within 7 days",
        metric: "18.4%",
        status: "done",
        details: ["Conversion attribution", "Workflow exit on goal", "Revenue and engagement rollups"],
      },
    },
    {
      id: "exit",
      type: "workflow",
      position: { x: 1860, y: 120 },
      data: {
        kind: "exit",
        label: "Exit Node",
        subtitle: "Completed, suppressed, or goal met",
        metric: "1.1k exits",
        status: "done",
        details: ["Terminal workflow state", "Audit log appended", "State TTL cleanup scheduled"],
      },
    },
  ]

  const edgeBase = {
    animated: true,
    style: { stroke: "#22d3ee", strokeWidth: 2 },
  }
  const edges: Edge[] = [
    { id: "e-trigger-condition", source: "trigger", target: "condition", label: "event matches", ...edgeBase },
    { id: "e-condition-frequency", source: "condition", target: "frequency", label: "qualified", ...edgeBase },
    { id: "e-frequency-delay", source: "frequency", target: "delay", label: "under cap", ...edgeBase },
    { id: "e-frequency-branch", source: "frequency", target: "branch", label: "test split", ...edgeBase },
    { id: "e-delay-send", source: "delay", target: "send", label: "timer fired", ...edgeBase },
    { id: "e-branch-send", source: "branch", target: "send", label: "variant A", ...edgeBase },
    { id: "e-send-webhook", source: "send", target: "webhook", label: "delivered", ...edgeBase },
    { id: "e-send-goal", source: "send", target: "goal", label: "track", ...edgeBase },
    { id: "e-webhook-exit", source: "webhook", target: "exit", label: "ack", ...edgeBase },
    { id: "e-goal-exit", source: "goal", target: "exit", label: "converted", ...edgeBase },
  ]

  return { nodes, edges }
}

function WorkflowCanvas({
  trigger,
  onRunTest,
  runningTest,
  runResult,
}: {
  trigger: {
    name: string
    event_type: string
    send_once_per_user: boolean
    conditions: ConditionGroup
    templates: { name: string } | null
  }
  onRunTest: () => Promise<void>
  runningTest: boolean
  runResult: ReplayResult | null
}) {
  const initial = useMemo(() => buildWorkflow(trigger), [trigger])
  const [nodes, , onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [selectedNodeId, setSelectedNodeId] = useState("trigger")
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<WorkflowGraphNode, Edge> | null>(null)
  const [fitOpen, setFitOpen] = useState(false)
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]

  const fitCanvas = useCallback(() => {
    void flowInstance?.fitView({ padding: 0.18, duration: 450 })
  }, [flowInstance])

  const openFitModal = useCallback(() => {
    fitCanvas()
    setFitOpen(true)
  }, [fitCanvas])

  useEffect(() => {
    if (!flowInstance) return
    const frame = requestAnimationFrame(() => {
      flowInstance.fitView({ padding: 0.18, duration: 0 })
    })
    return () => cancelAnimationFrame(frame)
  }, [flowInstance, nodes.length, fitOpen])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: "#a78bfa", strokeWidth: 2 },
          label: "manual path",
        },
        current
      )
    )
  }, [setEdges])

  const selectNode = useCallback((_: unknown, node: WorkflowGraphNode) => {
    setSelectedNodeId(node.id)
  }, [])

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <GlassCard className="glass-panel-canvas min-h-[720px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-flow-glass-faint px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-flow-faint">Automation Canvas</p>
            <h2 className="text-lg font-semibold text-flow">{trigger.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={canvasToolbarButtonClass}
              onClick={fitCanvas}
            >
              <Maximize2 />
              Fit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={canvasToolbarButtonClass}
              onClick={openFitModal}
            >
              <Maximize2 />
              Expand
            </Button>
            <Button size="sm" onClick={() => void onRunTest()} disabled={runningTest}>
              {runningTest ? <Loader2 className="animate-spin" /> : <Play />}
              Run test
            </Button>
          </div>
        </div>
        <div className="relative isolate h-[650px] overflow-hidden rounded-b-2xl bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.15),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.12),transparent_30%)]">
          <ReactFlow<WorkflowGraphNode, Edge>
            className={flowCanvasClass}
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={selectNode}
            onInit={setFlowInstance}
            minZoom={0.35}
            maxZoom={1.35}
            defaultEdgeOptions={graphEdgeOptions}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.08)" gap={24} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => (node.id === selectedNodeId ? "#22d3ee" : "#6d28d9")}
              className="!border !border-white/10 !bg-black/40"
            />
            <Controls className={flowControlsClass} />
          </ReactFlow>
        </div>
      </GlassCard>

      {fitOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-panel relative max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl"
          >
            <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3 border-b border-flow-glass-faint px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-flow-faint">Workflow Command Center</p>
                <h3 className="text-2xl font-semibold text-flow">{trigger.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className={canvasToolbarButtonClass} onClick={fitCanvas}>
                  <Maximize2 />
                  Fit canvas
                </Button>
                <Button onClick={() => void onRunTest()} disabled={runningTest}>
                  {runningTest ? <Loader2 className="animate-spin" /> : <Play />}
                  Run test
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setFitOpen(false)} aria-label="Close workflow popup">
                  <X />
                </Button>
              </div>
            </div>
            <div className="relative z-[1] grid gap-4 p-6 lg:grid-cols-[1.45fr_0.55fr]">
              <div className="overflow-hidden rounded-xl border border-flow-glass-faint bg-black/30">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="px-4 pt-4 text-sm font-semibold text-flow">Automation Canvas</h4>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                    {nodes.length} nodes · {edges.length} paths
                  </span>
                </div>
                <div className="relative isolate h-[560px] overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.14),transparent_30%)]">
                  <ReactFlow<WorkflowGraphNode, Edge>
                    className={flowCanvasClass}
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={selectNode}
                    onInit={(instance) => {
                      requestAnimationFrame(() => {
                        instance.fitView({ padding: 0.18, duration: 0 })
                      })
                    }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    defaultEdgeOptions={graphEdgeOptions}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="rgba(255,255,255,0.08)" gap={24} />
                    <MiniMap
                      pannable
                      zoomable
                      nodeColor={(node) => (node.id === selectedNodeId ? "#22d3ee" : "#6d28d9")}
                      className="!border !border-white/10 !bg-black/45"
                    />
                    <Controls className={flowControlsClass} />
                  </ReactFlow>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-flow-glass-faint bg-black/30 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-flow">Test Result</h4>
                  {runningTest ? (
                    <div className="flex items-center gap-2 text-sm text-flow-muted">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                      Running event replay through the rule evaluator...
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3">
                        <p className="text-xs text-flow-faint">Replay</p>
                        <p className="font-mono text-sm text-emerald-100">{runResult.replay_id}</p>
                      </div>
                      {runResult.evaluations.map((evaluation) => (
                        <div key={evaluation.trigger_id} className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-flow">{evaluation.trigger_name}</p>
                            <span className={cn("rounded-full px-2 py-0.5 text-[11px]", evaluation.matched ? "bg-emerald-400/15 text-emerald-200" : "bg-amber-400/15 text-amber-200")}>
                              {evaluation.matched ? "matched" : "skipped"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-flow-faint">{evaluation.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-flow-muted">Run a test to validate event ingestion, conditions, caps, and delivery queueing.</p>
                  )}
                </div>
                <div className="rounded-xl border border-flow-glass-faint bg-black/30 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-flow">Selected Node</h4>
                  <p className="text-sm font-medium text-flow">{selectedNode.data.label}</p>
                  <p className="mt-1 text-xs text-flow-muted">{selectedNode.data.subtitle}</p>
                  <div className="mt-3 space-y-2">
                    {selectedNode.data.details.map((detail) => (
                      <div key={detail} className="flex gap-2 text-xs text-flow-muted">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}

      <aside className="space-y-4">
        <GlassCard className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-flow-faint">Inspector</p>
              <h3 className="text-base font-semibold text-flow">{selectedNode.data.label}</h3>
            </div>
            <Route className="h-5 w-5 text-cyan-300" />
          </div>
          <p className="rounded-lg border border-flow-glass-faint bg-flow-glass-inset p-3 text-sm text-flow-secondary">
            {selectedNode.data.subtitle}
          </p>
          <div className="mt-4 space-y-2">
            {selectedNode.data.details.map((detail) => (
              <div key={detail} className="flex items-start gap-2 text-xs text-flow-muted">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                {detail}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-flow">Node Palette</h3>
            <Workflow className="h-4 w-4 text-violet-300" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {nodeCatalog.map((item) => (
              <button key={item.kind} className="flex items-center gap-2 rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-left text-xs text-flow-muted transition hover:border-flow-glass-hover hover:text-flow">
                <item.icon className="h-3.5 w-3.5 text-cyan-300" />
                {item.label}
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-flow">Execution Debugger</h3>
            <Beaker className="h-4 w-4 text-amber-300" />
          </div>
          <div className="space-y-2 text-xs">
            {[
              ["Event accepted", "3ms"],
              ["Dedup lock acquired", "8ms"],
              ["Conditions evaluated", "14ms"],
              ["Frequency cap passed", "22ms"],
              ["Delivery queued", "31ms"],
            ].map(([label, time]) => (
              <div key={label} className="flex items-center justify-between rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2">
                <span className="text-flow-secondary">{label}</span>
                <span className="font-mono text-cyan-200">{time}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </aside>
    </div>
  )
}

export function WorkflowBuilder() {
  const { data, loading, error } = usePlatformDataContext()
  const triggers = data?.triggers ?? []
  const events = data?.events ?? []
  const active = triggers.find((trigger) => trigger.enabled) ?? triggers[0]
  const [selectedTriggerId, setSelectedTriggerId] = useState<string | null>(null)
  const [runningTest, setRunningTest] = useState(false)
  const [runResult, setRunResult] = useState<ReplayResult | null>(null)
  const [runMessage, setRunMessage] = useState<string | null>(null)
  const selected = triggers.find((trigger) => trigger.id === selectedTriggerId) ?? active
  const activeConditions = selected ? parseConditionGroup(selected.conditions) : { operator: "and" as const, rules: [] }
  const previewPayload = selected ? buildSamplePayload(selected.event_type) : buildSamplePayload("user.plan_upgraded")

  const runWorkflowTest = async () => {
    if (!selected) return
    setRunningTest(true)
    setRunMessage(null)
    try {
      const result = await apiPost<ReplayResult>("/api/workflows/replay", buildSamplePayload(selected.event_type))
      setRunResult(result)
      const matched = result.evaluations.filter((evaluation) => evaluation.matched).length
      setRunMessage(`Replay accepted. ${matched}/${result.evaluations.length} trigger${result.evaluations.length === 1 ? "" : "s"} matched.`)
    } catch (err) {
      setRunMessage(err instanceof Error ? err.message : "Replay failed")
    } finally {
      setRunningTest(false)
    }
  }

  const metrics = [
    { label: "Active users", value: "1,284", icon: Users, tone: "text-cyan-300" },
    { label: "Waiting", value: "318", icon: PauseCircle, tone: "text-sky-300" },
    { label: "Qualified", value: "72%", icon: Filter, tone: "text-violet-300" },
    { label: "Goal rate", value: "18.4%", icon: Target, tone: "text-lime-300" },
    { label: "Retries", value: "21", icon: RefreshCw, tone: "text-amber-300" },
    { label: "DLQ", value: "3", icon: AlarmClock, tone: "text-rose-300" },
  ]

  return (
    <>
      <TopNavbar title="Rule Engine" subtitle="Visual workflows for event-triggered lifecycle automation" />
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <LoadingState rows={4} />
      ) : !selected ? (
        <EmptyState message="No triggers configured" hint="Run the seed migration or create a trigger via POST /api/triggers." />
      ) : (
        <div className="space-y-6">
          {runMessage ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "fixed right-5 top-24 z-40 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur",
                runMessage.includes("failed") || runMessage.includes("Invalid")
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
                  : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              )}
            >
              {runMessage}
            </motion.div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {metrics.map((metric) => (
              <GlassCard key={metric.label} className="p-4">
                <div className="flex items-center justify-between">
                  <metric.icon className={cn("h-4 w-4", metric.tone)} />
                  <span className="text-[11px] text-flow-faint">live</span>
                </div>
                <p className="mt-4 text-2xl font-semibold text-flow">{metric.value}</p>
                <p className="text-xs text-flow-muted">{metric.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
            <aside className="space-y-4">
              <GlassCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-flow">Automations</h2>
                  <Search className="h-4 w-4 text-flow-faint" />
                </div>
                <div className="space-y-2">
                  {triggers.map((trigger) => (
                    <button
                      key={trigger.id}
                      onClick={() => setSelectedTriggerId(trigger.id)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-3 text-left transition",
                        selected.id === trigger.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-flow-glass-faint bg-flow-glass-subtle hover:border-flow-glass-hover"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-flow">{trigger.name}</span>
                        <span className={cn("h-2 w-2 rounded-full", trigger.enabled ? "bg-emerald-300" : "bg-slate-500")} />
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-flow-faint">{trigger.event_type}</p>
                    </button>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-sm font-semibold text-flow">Event Replay Simulator</h2>
                </div>
                <pre className="max-h-[240px] overflow-auto rounded-lg border border-flow-glass-faint bg-black/35 p-3 text-[11px] leading-relaxed text-cyan-100/80">
                  {formatPayload(previewPayload)}
                </pre>
                <Button className="mt-3 w-full" onClick={() => void runWorkflowTest()} disabled={runningTest}>
                  {runningTest ? <Loader2 className="animate-spin" /> : <Play />}
                  Replay payload
                </Button>
                {runResult ? (
                  <div className="mt-3 rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                    <p className="text-[11px] uppercase tracking-wide text-flow-faint">Last replay</p>
                    <p className="mt-1 truncate font-mono text-xs text-cyan-200">{runResult.idempotency_key}</p>
                  </div>
                ) : null}
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Braces className="h-4 w-4 text-violet-300" />
                  <h2 className="text-sm font-semibold text-flow">Supported Events</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {eventExamples.map((event) => (
                    <span key={event} className="rounded-md border border-flow-glass-faint bg-flow-glass-subtle px-2 py-1 font-mono text-[11px] text-flow-muted">
                      {event}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </aside>

            <main className="space-y-4">
              <GlassCard className="p-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    ["When", selected.event_type, Zap],
                    ["Who qualifies", conditionSummary(activeConditions), Filter],
                    ["How often", selected.send_once_per_user ? "Send once per user" : "Cooldown + quiet hours", TimerReset],
                    ["What next", "Delay -> branch -> send -> goal", Send],
                  ].map(([label, value, Icon]) => (
                    <div key={String(label)} className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-flow-faint">
                        <Icon className="h-3.5 w-3.5 text-cyan-300" />
                        {String(label)}
                      </div>
                      <p className="line-clamp-2 text-sm text-flow-secondary">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <WorkflowCanvas
                key={selected.id}
                trigger={{ ...selected, conditions: activeConditions }}
                onRunTest={runWorkflowTest}
                runningTest={runningTest}
                runResult={runResult}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { title: "Rule Evaluation Inspector", icon: Activity, lines: ["payload.plan_name equals pro", "user.unsubscribed false", "emails_sent_last_7_days < 3"] },
                  { title: "Scheduling Controls", icon: Clock3, lines: ["Quiet hours 9pm-8am recipient local time", "Cooldown 7 days", "Transactional bypass allowed"] },
                  { title: "Queue Health", icon: Globe2, lines: ["Redis streams for hot events", "BullMQ delayed jobs", "Dead-letter queue with replay"] },
                ].map((panel) => (
                  <GlassCard key={panel.title} className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <panel.icon className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-sm font-semibold text-flow">{panel.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {panel.lines.map((line) => (
                        <div key={line} className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-xs text-flow-muted">
                          {line}
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-flow">Recent Executions</h3>
                  <span className="text-xs text-flow-faint">{events.length} events loaded</span>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {(events.length ? events.slice(0, 4) : [{ id: "demo", type: selected.event_type, created_at: new Date().toISOString(), processed_at: null }]).map((event) => (
                    <div key={event.id} className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-flow-secondary">{event.type}</span>
                        <span className="text-[11px] text-flow-faint">{event.processed_at ? "processed" : "pending"}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-flow-faint">Deduped, evaluated, state persisted, delivery queued.</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </main>
          </div>
        </div>
      )}
    </>
  )
}
