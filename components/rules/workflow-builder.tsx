"use client"

import {
  Activity,
  AlarmClock,
  Filter,
  Globe2,
  PauseCircle,
  RefreshCw,
  Search,
  Send,
  Target,
  TimerReset,
  Users,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { EventReplaySimulator } from "@/components/rules/event-replay-simulator"
import { WorkflowCanvas } from "@/components/rules/workflow-canvas"
import { GlassCard } from "@/components/motion/glass-card"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { cn } from "@/lib/utils"
import { parseConditionGroup } from "@/lib/engine/conditions"
import { useWorkflowExecution } from "@/lib/hooks/use-workflow-execution"
import {
  automationToWorkflowSource,
  triggerToWorkflowSource,
} from "@/lib/workflow/build-graph"
import { conditionSummary } from "@/lib/workflow/humanize"
import type { WorkflowAutomationSource } from "@/lib/workflow/types"
import type { AutomationWithTemplate } from "@/lib/platform/types"
import type { IncomingEvent } from "@/lib/types/database"
import { DEFAULT_DELIVERY_RULES } from "@/lib/types/automation"
import type { DeliveryRules } from "@/lib/types/automation"

type SidebarItem = {
  id: string
  name: string
  event_type: string
  status: string
  enabled: boolean
  kind: "automation" | "trigger"
}

function toSidebarItems(
  automations: AutomationWithTemplate[],
  triggers: ReturnType<typeof usePlatformDataContext> extends never
    ? never
    : NonNullable<ReturnType<typeof usePlatformDataContext>["data"]>["triggers"]
): SidebarItem[] {
  const autoItems: SidebarItem[] = automations.map((a) => ({
    id: a.id,
    name: a.name,
    event_type: a.trigger_event,
    status: a.status,
    enabled: a.status === "active",
    kind: "automation",
  }))

  const linkedTriggerIds = new Set(
    automations.map((a) => a.trigger_id).filter(Boolean)
  )

  const orphanTriggers = triggers
    .filter((t) => !linkedTriggerIds.has(t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      event_type: t.event_type,
      status: t.enabled ? "active" : "paused",
      enabled: t.enabled,
      kind: "trigger" as const,
    }))

  return [...autoItems, ...orphanTriggers]
}

export function WorkflowBuilder() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data, loading, error, refresh } = usePlatformDataContext()

  const automations = data?.automations ?? []
  const triggers = data?.triggers ?? []
  const events = data?.events ?? []
  const eventTypes = data?.eventTypes ?? []
  const sendLog = data?.sendLog ?? []

  const sidebarItems = useMemo(
    () => toSidebarItems(automations, triggers),
    [automations, triggers]
  )

  const urlAutomationId = searchParams.get("automation")
  const urlTriggerId = searchParams.get("trigger")

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedKind, setSelectedKind] = useState<"automation" | "trigger">("automation")
  const [search, setSearch] = useState("")
  const [runMessage, setRunMessage] = useState<string | null>(null)

  const execution = useWorkflowExecution()

  useEffect(() => {
    if (urlAutomationId) {
      setSelectedId(urlAutomationId)
      setSelectedKind("automation")
      return
    }
    if (urlTriggerId) {
      setSelectedId(urlTriggerId)
      setSelectedKind("trigger")
    }
  }, [urlAutomationId, urlTriggerId])

  useEffect(() => {
    if (selectedId || sidebarItems.length === 0) return
    const first = sidebarItems[0]
    setSelectedId(first.id)
    setSelectedKind(first.kind)
  }, [selectedId, sidebarItems])

  const selectItem = useCallback(
    (item: SidebarItem) => {
      setSelectedId(item.id)
      setSelectedKind(item.kind)
      const param = item.kind === "automation" ? "automation" : "trigger"
      router.replace(`/rules?${param}=${item.id}`, { scroll: false })
      execution.reset()
    },
    [router, execution]
  )

  const workflowSource: WorkflowAutomationSource | null = useMemo(() => {
    if (!selectedId) return null

    if (selectedKind === "automation") {
      const automation = automations.find((a) => a.id === selectedId)
      if (!automation) return null
      const trigger = automation.trigger_id
        ? triggers.find((t) => t.id === automation.trigger_id)
        : null
      const delivery =
        automation.delivery_rules && typeof automation.delivery_rules === "object"
          ? ({ ...DEFAULT_DELIVERY_RULES, ...automation.delivery_rules } as DeliveryRules)
          : DEFAULT_DELIVERY_RULES

      return automationToWorkflowSource(
        {
          ...automation,
          conditions: parseConditionGroup(automation.conditions),
          delivery_rules: delivery,
        },
        trigger ? { enabled: trigger.enabled, send_once_per_user: trigger.send_once_per_user } : null
      )
    }

    const trigger = triggers.find((t) => t.id === selectedId)
    if (!trigger) return null
    return triggerToWorkflowSource({
      ...trigger,
      conditions: parseConditionGroup(trigger.conditions),
      templates: trigger.templates,
    })
  }, [selectedId, selectedKind, automations, triggers])

  const filteredSidebar = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sidebarItems
    return sidebarItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.event_type.toLowerCase().includes(q)
    )
  }, [sidebarItems, search])

  const runWorkflowTest = useCallback(
    async (event?: IncomingEvent) => {
      if (!workflowSource) return
      setRunMessage(null)
      try {
        const result = await execution.run({
          automationId: selectedKind === "automation" ? workflowSource.id : undefined,
          triggerId: selectedKind === "trigger" ? workflowSource.id : undefined,
          event:
            event ??
            ({
              type: workflowSource.event_type,
              source: "workflow-simulator",
              message_id: `test_${Date.now()}`,
              payload: {},
            } as IncomingEvent),
        })
        if (result) {
          setRunMessage(
            result.success
              ? `Execution completed in test mode (${result.logs.length} steps logged).`
              : `Execution ${result.final_status}: ${result.steps.find((s) => !s.passed)?.reason ?? "failed"}`
          )
        }
      } catch (err) {
        setRunMessage(err instanceof Error ? err.message : "Execution failed")
      }
    },
    [workflowSource, selectedKind, execution]
  )

  const activeConditions = workflowSource?.conditions ?? {
    operator: "and" as const,
    rules: [],
  }

  const uniqueUsers = useMemo(
    () => new Set(events.map((e) => e.user_external_id).filter(Boolean)).size,
    [events]
  )

  const metrics = [
    {
      label: "Active users",
      value: uniqueUsers > 0 ? uniqueUsers.toLocaleString() : "—",
      icon: Users,
      tone: "text-cyan-300",
    },
    {
      label: "Automations",
      value: String(automations.filter((a) => a.status === "active").length),
      icon: PauseCircle,
      tone: "text-sky-300",
    },
    {
      label: "Sent",
      value: String(data?.sentCount ?? 0),
      icon: Filter,
      tone: "text-violet-300",
    },
    {
      label: "Sent today",
      value: String(data?.sentToday ?? 0),
      icon: Target,
      tone: "text-lime-300",
    },
    {
      label: "Failed",
      value: String(data?.failedCount ?? 0),
      icon: RefreshCw,
      tone: "text-amber-300",
    },
    {
      label: "Skipped",
      value: String(data?.skippedCount ?? 0),
      icon: AlarmClock,
      tone: "text-rose-300",
    },
  ]

  return (
    <>
      <TopNavbar
        title="Rule Engine"
        subtitle="Realtime event orchestration with observability and replay"
      />
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <LoadingState rows={4} />
      ) : !workflowSource ? (
        <EmptyState
          message="No automations yet"
          hint="Create one with + New automation, then open the workflow editor."
        />
      ) : (
        <div className="space-y-6">
          {runMessage ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "fixed right-5 top-24 z-40 rounded-lg border px-4 py-3 text-sm shadow-2xl backdrop-blur",
                runMessage.includes("failed") || runMessage.includes("failed")
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
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-flow">Automations</h2>
                  <Search className="h-4 w-4 shrink-0 text-flow-faint" />
                </div>
                <input
                  type="search"
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-xs text-flow placeholder:text-flow-faint focus:border-cyan-300/30 focus:outline-none"
                />
                <div className="max-h-[320px] space-y-2 overflow-y-auto">
                  {filteredSidebar.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => selectItem(item)}
                      className={cn(
                        "w-full rounded-lg border px-3 py-3 text-left transition",
                        selectedId === item.id && selectedKind === item.kind
                          ? "border-cyan-300/50 bg-cyan-300/10"
                          : "border-flow-glass-faint bg-flow-glass-subtle hover:border-flow-glass-hover"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-flow">
                          {item.name}
                        </span>
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            item.enabled ? "bg-emerald-300" : "bg-slate-500"
                          )}
                        />
                      </div>
                      <p className="mt-1 truncate font-mono text-[11px] text-flow-faint">
                        {item.event_type}
                      </p>
                    </button>
                  ))}
                </div>
              </GlassCard>

              <EventReplaySimulator
                eventType={workflowSource.event_type}
                eventTypes={eventTypes}
                onReplay={async (event) => {
                  await runWorkflowTest(event)
                }}
                running={execution.running}
                lastIdempotencyKey={execution.result?.idempotency_key}
              />
            </aside>

            <main className="space-y-4">
              <GlassCard className="p-4">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    ["When", workflowSource.event_type, Zap],
                    ["Who qualifies", conditionSummary(activeConditions), Filter],
                    [
                      "How often",
                      workflowSource.send_once_per_user
                        ? "Send once per user"
                        : workflowSource.delivery_rules.mode,
                      TimerReset,
                    ],
                    [
                      "Flow",
                      "Trigger → Condition → Delay → Send → Goal",
                      Send,
                    ],
                  ].map(([label, value, Icon]) => (
                    <div
                      key={String(label)}
                      className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3"
                    >
                      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-flow-faint">
                        <Icon className="h-3.5 w-3.5 text-cyan-300" />
                        {String(label)}
                      </div>
                      <p className="line-clamp-2 text-sm text-flow-secondary">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <WorkflowCanvas
                key={`${selectedKind}-${workflowSource.id}`}
                source={workflowSource}
                onRunTest={() => runWorkflowTest()}
                runningTest={execution.running}
                execution={execution.result}
                activeNodeId={execution.activeNodeId}
                nodeStatuses={execution.nodeStatuses}
                activeEdgeIds={execution.activeEdgeIds}
                executionLogs={execution.logs}
              />

              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    title: "Rule Evaluation",
                    icon: Activity,
                    lines: activeConditions.rules.length
                      ? [conditionSummary(activeConditions)]
                      : ["No conditions — all events pass"],
                  },
                  {
                    title: "Delivery",
                    icon: TimerReset,
                    lines: [
                      `Delay: ${workflowSource.delivery_rules.delay_minutes}m`,
                      `Mode: ${workflowSource.delivery_rules.mode}`,
                    ],
                  },
                  {
                    title: "Send log",
                    icon: Globe2,
                    lines:
                      sendLog.length > 0
                        ? sendLog.slice(0, 3).map(
                            (r) =>
                              `${r.templates?.name ?? "—"} — ${r.status}`
                          )
                        : ["No deliveries yet"],
                  },
                ].map((panel) => (
                  <GlassCard key={panel.title} className="p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <panel.icon className="h-4 w-4 text-cyan-300" />
                      <h3 className="text-sm font-semibold text-flow">{panel.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {panel.lines.map((line) => (
                        <div
                          key={line}
                          className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-xs text-flow-muted"
                        >
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
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="text-xs text-cyan-300 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  {events.slice(0, 6).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-left transition hover:border-cyan-300/30"
                      onClick={() => {
                        if (!workflowSource) return
                        void runWorkflowTest({
                          type: event.type,
                          message_id: event.id,
                          source: "historical-replay",
                          payload:
                            event.payload && typeof event.payload === "object"
                              ? (event.payload as Record<string, unknown>)
                              : {},
                          user: event.user_external_id
                            ? {
                                external_id: event.user_external_id,
                                email: `${event.user_external_id}@replay.local`,
                              }
                            : undefined,
                        })
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-flow-secondary">
                          {event.type}
                        </span>
                        <span className="text-[11px] text-flow-faint">
                          {event.processed_at ? "processed" : "pending"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-flow-faint">
                        Click to replay through current workflow
                      </p>
                    </button>
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
