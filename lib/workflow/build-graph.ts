import type { DeliveryRules } from "@/lib/types/automation"
import {
  conditionSummary,
  formatDelayLabel,
  formatFrequencyLabel,
} from "@/lib/workflow/humanize"
import type {
  WorkflowAutomationSource,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowNodeStatus,
} from "@/lib/workflow/types"

const EDGE_STYLE = { stroke: "#22d3ee", strokeWidth: 2 }

function statusForAutomation(enabled: boolean, status: string): WorkflowNodeStatus {
  if (!enabled || status !== "active") return "guarded"
  return "live"
}

export function buildWorkflowGraph(source: WorkflowAutomationSource): {
  nodes: WorkflowGraphNode[]
  edges: WorkflowGraphEdge[]
} {
  const rules = source.delivery_rules
  const condition = conditionSummary(source.conditions)
  const live = statusForAutomation(source.enabled, source.status)
  const templateName = source.templates?.name ?? "No template selected"

  const nodes: WorkflowGraphNode[] = [
    {
      id: "trigger",
      type: "workflow",
      position: { x: 0, y: 100 },
      data: {
        kind: "trigger",
        label: "Trigger",
        subtitle: source.event_type,
        metric: source.enabled ? "listening" : "paused",
        status: live,
        details: [
          `Event: ${source.event_type}`,
          "Validates payload shape and identifiers",
          "Idempotency: source + message_id",
        ],
        config: { event_type: source.event_type },
      },
    },
    {
      id: "condition",
      type: "workflow",
      position: { x: 280, y: 100 },
      data: {
        kind: "condition",
        label: "Conditions",
        subtitle: condition,
        metric: source.conditions.rules.length ? "rules active" : "pass-through",
        status: "guarded",
        details: [
          "Evaluates payload, user metadata, aggregates",
          "Nested AND/OR groups supported",
        ],
        config: { conditions: source.conditions },
      },
    },
    {
      id: "frequency",
      type: "workflow",
      position: { x: 560, y: 100 },
      data: {
        kind: "frequency",
        label: "Frequency Cap",
        subtitle: formatFrequencyLabel(
          source.send_once_per_user,
          rules.mode,
          rules.cooldown_days
        ),
        metric: source.send_once_per_user ? "once/user" : rules.mode,
        status: "guarded",
        details: [
          rules.max_sends_per_user
            ? `Max ${rules.max_sends_per_user} sends per user`
            : "No per-user max configured",
          "Suppression and unsubscribe checks",
        ],
        config: { delivery_mode: rules.mode },
      },
    },
    {
      id: "delay",
      type: "workflow",
      position: { x: 840, y: 100 },
      data: {
        kind: "delay",
        label: "Delay",
        subtitle: formatDelayLabel(rules.delay_minutes, rules.send_immediately),
        metric: rules.delay_minutes > 0 ? `${rules.delay_minutes}m` : "instant",
        status: rules.delay_minutes > 0 ? "waiting" : "live",
        details: [
          rules.send_immediately
            ? "Immediate delivery when qualified"
            : "Scheduled delay before send",
          "Test mode simulates delay instantly",
        ],
        config: { delay_minutes: rules.delay_minutes },
      },
    },
    {
      id: "send",
      type: "workflow",
      position: { x: 1120, y: 100 },
      data: {
        kind: "send",
        label: "Send Template",
        subtitle: templateName,
        metric: source.templates?.status ?? "—",
        status: source.templates ? "live" : "guarded",
        details: [
          `Template: ${templateName}`,
          "Render + deliver via configured provider",
          "Retries with exponential backoff",
        ],
        config: {
          template_id: source.templates?.id,
          template_name: templateName,
        },
      },
    },
    {
      id: "goal",
      type: "workflow",
      position: { x: 1400, y: 100 },
      data: {
        kind: "goal",
        label: "Goal",
        subtitle: `Conversion on ${source.event_type}`,
        metric: "track",
        status: "done",
        details: [
          "Marks successful workflow completion",
          "Attribution window: 7 days",
          "Exits automation on goal met",
        ],
      },
    },
  ]

  const edges: WorkflowGraphEdge[] = [
    {
      id: "e-trigger-condition",
      source: "trigger",
      target: "condition",
      label: "event received",
      animated: true,
      style: EDGE_STYLE,
    },
    {
      id: "e-condition-frequency",
      source: "condition",
      target: "frequency",
      label: "qualified",
      animated: true,
      style: EDGE_STYLE,
    },
    {
      id: "e-frequency-delay",
      source: "frequency",
      target: "delay",
      label: "under cap",
      animated: true,
      style: EDGE_STYLE,
    },
    {
      id: "e-delay-send",
      source: "delay",
      target: "send",
      label: "timer fired",
      animated: true,
      style: EDGE_STYLE,
    },
    {
      id: "e-send-goal",
      source: "send",
      target: "goal",
      label: "delivered",
      animated: true,
      style: EDGE_STYLE,
    },
  ]

  return { nodes, edges }
}

export function automationToWorkflowSource(
  automation: {
    id: string
    name: string
    trigger_event: string
    status: string
    conditions: unknown
    delivery_rules: DeliveryRules
    trigger_id: string | null
    templates: { id: string; name: string; status: string } | null
  },
  trigger?: {
    enabled: boolean
    send_once_per_user: boolean
  } | null
): WorkflowAutomationSource {
  const conditions =
    automation.conditions && typeof automation.conditions === "object"
      ? (automation.conditions as WorkflowAutomationSource["conditions"])
      : { operator: "and" as const, rules: [] }

  return {
    id: automation.id,
    name: automation.name,
    event_type: automation.trigger_event,
    status: automation.status as WorkflowAutomationSource["status"],
    enabled: automation.status === "active" && (trigger?.enabled ?? true),
    send_once_per_user:
      trigger?.send_once_per_user ?? automation.delivery_rules.mode === "once_per_user",
    conditions,
    delivery_rules: automation.delivery_rules,
    templates: automation.templates,
    trigger_id: automation.trigger_id,
  }
}

export function triggerToWorkflowSource(trigger: {
  id: string
  name: string
  event_type: string
  enabled: boolean
  send_once_per_user: boolean
  conditions: unknown
  templates: { id: string; name: string; status: string } | null
}): WorkflowAutomationSource {
  const conditions =
    trigger.conditions && typeof trigger.conditions === "object"
      ? (trigger.conditions as WorkflowAutomationSource["conditions"])
      : { operator: "and" as const, rules: [] }

  const delivery_rules: DeliveryRules = {
    mode: trigger.send_once_per_user ? "once_per_user" : "every_trigger",
    delay_minutes: 0,
    cooldown_days: 0,
    max_sends_per_user: trigger.send_once_per_user ? 1 : null,
    send_immediately: true,
  }

  return {
    id: trigger.id,
    name: trigger.name,
    event_type: trigger.event_type,
    status: trigger.enabled ? "active" : "paused",
    enabled: trigger.enabled,
    send_once_per_user: trigger.send_once_per_user,
    conditions,
    delivery_rules,
    templates: trigger.templates,
    trigger_id: trigger.id,
  }
}
