"use client"

import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
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
  Mail,
  Maximize2,
  MousePointer2,
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
  Zap,
} from "lucide-react"
import { useMemo, useState } from "react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { parseConditionGroup } from "@/lib/engine/conditions"
import type { ConditionGroup } from "@/lib/types/database"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

const samplePayload = `{
  "event": "user.plan_upgraded",
  "message_id": "evt_01HY",
  "timestamp": "2026-05-23T01:45:00.000Z",
  "source": "billing",
  "user": {
    "external_id": "user_123",
    "email": "alex@example.com",
    "metadata": { "plan_name": "pro", "timezone": "Asia/Calcutta" }
  },
  "payload": { "plan_name": "pro", "mrr": 99 }
}`

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

function WorkflowNode({ data, selected }: NodeProps<Node<WorkflowNodeData>>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "min-w-[220px] rounded-2xl border p-4 shadow-[0_0_45px_-18px] backdrop-blur-xl transition",
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
    </motion.div>
  )
}

const nodeTypes = { workflow: WorkflowNode }

function buildWorkflow(trigger: {
  name: string
  event_type: string
  send_once_per_user: boolean
  conditions: ConditionGroup
  templates: { name: string } | null
}) {
  const condition = conditionSummary(trigger.conditions)
  const nodes: Array<Node<WorkflowNodeData>> = [
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
}: {
  trigger: {
    name: string
    event_type: string
    send_once_per_user: boolean
    conditions: ConditionGroup
    templates: { name: string } | null
  }
}) {
  const initial = useMemo(() => buildWorkflow(trigger), [trigger])
  const [nodes, , onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [selectedNodeId, setSelectedNodeId] = useState("trigger")
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0]

  const onConnect = (connection: Connection) => {
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
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <GlassCard className="min-h-[720px] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-flow-glass-faint px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-flow-faint">Automation Canvas</p>
            <h2 className="text-lg font-semibold text-flow">{trigger.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><MousePointer2 />Pan</Button>
            <Button variant="outline" size="sm"><Maximize2 />Fit</Button>
            <Button size="sm"><Play />Run test</Button>
          </div>
        </div>
        <div className="h-[650px] bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.15),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.12),transparent_30%)]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            fitView
            minZoom={0.35}
            maxZoom={1.35}
            defaultEdgeOptions={{ animated: true }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.08)" gap={24} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => (node.id === selectedNodeId ? "#22d3ee" : "#6d28d9")}
              className="!border !border-white/10 !bg-black/40"
            />
            <Controls className="!border !border-white/10 !bg-black/45 !text-white" />
          </ReactFlow>
        </div>
      </GlassCard>

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
  const selected = triggers.find((trigger) => trigger.id === selectedTriggerId) ?? active
  const activeConditions = selected ? parseConditionGroup(selected.conditions) : { operator: "and" as const, rules: [] }

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
                  {samplePayload}
                </pre>
                <Button className="mt-3 w-full"><Play />Replay payload</Button>
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

              <WorkflowCanvas key={selected.id} trigger={{ ...selected, conditions: activeConditions }} />

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
