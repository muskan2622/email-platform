import type { ConditionGroup } from "@/lib/types/database"
import type { DeliveryRules } from "@/lib/types/automation"

export type WorkflowNodeKind =
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

export type WorkflowNodeStatus =
  | "idle"
  | "live"
  | "waiting"
  | "guarded"
  | "test"
  | "done"
  | "running"
  | "success"
  | "failure"
  | "skipped"

export type WorkflowAutomationSource = {
  id: string
  name: string
  event_type: string
  status: "draft" | "active" | "paused" | "archived"
  enabled: boolean
  send_once_per_user: boolean
  conditions: ConditionGroup
  delivery_rules: DeliveryRules
  templates: { id: string; name: string; status: string } | null
  trigger_id: string | null
}

export type WorkflowGraphNodeData = {
  label: string
  subtitle: string
  kind: WorkflowNodeKind
  metric: string
  status: WorkflowNodeStatus
  details: string[]
  config?: Record<string, unknown>
}

export type WorkflowGraphNode = {
  id: string
  type: "workflow"
  position: { x: number; y: number }
  data: WorkflowGraphNodeData
}

export type WorkflowGraphEdge = {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: { stroke: string; strokeWidth: number }
}

export type ExecutionLogLevel = "info" | "success" | "warn" | "error"

export type ExecutionLogEntry = {
  id: string
  node_id: string
  label: string
  message: string
  level: ExecutionLogLevel
  duration_ms: number
  timestamp: string
  payload_snapshot?: Record<string, unknown>
  output?: Record<string, unknown>
}

export type ExecutionStepResult = {
  node_id: string
  kind: WorkflowNodeKind
  status: "success" | "failure" | "skipped"
  passed: boolean
  reason: string
  duration_ms: number
  output?: Record<string, unknown>
}

export type WorkflowExecutionResult = {
  execution_id: string
  automation_id: string
  automation_name: string
  event_type: string
  test_mode: boolean
  started_at: string
  completed_at: string
  success: boolean
  steps: ExecutionStepResult[]
  logs: ExecutionLogEntry[]
  final_status: "completed" | "failed" | "skipped"
  idempotency_key: string
}
