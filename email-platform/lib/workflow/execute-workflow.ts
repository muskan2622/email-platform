import { evaluateConditions } from "@/lib/engine/conditions"
import type { IncomingEvent } from "@/lib/types/database"
import type { DeliveryRules } from "@/lib/types/automation"
import type { ConditionGroup } from "@/lib/types/database"
import type {
  ExecutionLogEntry,
  ExecutionStepResult,
  WorkflowAutomationSource,
  WorkflowExecutionResult,
  WorkflowNodeKind,
} from "@/lib/workflow/types"

type ExecuteOptions = {
  test_mode?: boolean
  aggregates?: Record<string, unknown>
  activity?: Record<string, unknown>
}

const STEP_ORDER: WorkflowNodeKind[] = [
  "trigger",
  "condition",
  "frequency",
  "delay",
  "send",
  "goal",
]

function nowMs() {
  return Date.now()
}

function makeLog(
  nodeId: string,
  label: string,
  message: string,
  durationMs: number,
  level: ExecutionLogEntry["level"] = "info",
  extra?: Partial<ExecutionLogEntry>
): ExecutionLogEntry {
  return {
    id: crypto.randomUUID(),
    node_id: nodeId,
    label,
    message,
    level,
    duration_ms: durationMs,
    timestamp: new Date().toISOString(),
    ...extra,
  }
}

export function executeWorkflow(
  source: WorkflowAutomationSource,
  event: IncomingEvent,
  options: ExecuteOptions = {}
): WorkflowExecutionResult {
  const testMode = options.test_mode !== false
  const started = nowMs()
  const executionId = crypto.randomUUID()
  const steps: ExecutionStepResult[] = []
  const logs: ExecutionLogEntry[] = []

  const user = event.user
    ? {
        id: "sim",
        external_id: event.user.external_id,
        email: event.user.email,
        metadata: event.user.metadata ?? {},
        unsubscribed_product: event.user.unsubscribed_product ?? false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null

  const evalCtx = {
    payload: event.payload ?? {},
    user,
    aggregates: options.aggregates ?? {
      emails_sent_last_7_days: 0,
      messages_sent_last_30_days: 0,
      invoices_paid_lifetime: 0,
    },
    activity: options.activity ?? {
      last_login_at: new Date().toISOString(),
      projects_created: 0,
    },
  }

  let halted = false
  let finalStatus: WorkflowExecutionResult["final_status"] = "completed"

  for (const kind of STEP_ORDER) {
    if (halted) break
    const stepStart = nowMs()
    let passed = true
    let reason = "ok"
    let status: ExecutionStepResult["status"] = "success"
    let output: Record<string, unknown> | undefined

    switch (kind) {
      case "trigger": {
        const typeMatch = event.type === source.event_type
        passed = typeMatch && source.enabled
        reason = !source.enabled
          ? "automation_disabled"
          : typeMatch
            ? "event_type_matched"
            : `expected_${source.event_type}_got_${event.type}`
        if (!passed) {
          status = "failure"
          halted = true
          finalStatus = "skipped"
        }
        output = {
          event_type: event.type,
          message_id: event.message_id,
          source: event.source,
        }
        logs.push(
          makeLog(
            "trigger",
            "Trigger",
            passed ? `Event accepted: ${event.type}` : `Event rejected: ${reason}`,
            nowMs() - stepStart,
            passed ? "success" : "warn",
            { payload_snapshot: { type: event.type, user: event.user } }
          )
        )
        break
      }
      case "condition": {
        const matched = evaluateConditions(source.conditions, evalCtx)
        passed = matched
        reason = matched ? "conditions_passed" : "conditions_failed"
        if (!matched) {
          status = "skipped"
          halted = true
          finalStatus = "skipped"
        }
        output = {
          operator: source.conditions.operator,
          rule_count: source.conditions.rules.length,
          result: matched,
        }
        logs.push(
          makeLog(
            "condition",
            "Conditions",
            matched ? "All rules passed (TRUE)" : "Rules failed (FALSE)",
            nowMs() - stepStart,
            matched ? "success" : "warn",
            { output: { matched } }
          )
        )
        break
      }
      case "frequency": {
        const cap = checkFrequencyCap(source.delivery_rules, source.send_once_per_user, evalCtx)
        passed = cap.passed
        reason = cap.reason
        if (!passed) {
          status = "skipped"
          halted = true
          finalStatus = "skipped"
        }
        output = cap.output
        logs.push(
          makeLog(
            "frequency",
            "Frequency Cap",
            cap.message,
            nowMs() - stepStart,
            passed ? "success" : "warn",
            { output: cap.output }
          )
        )
        break
      }
      case "delay": {
        const rules = source.delivery_rules
        const delayMs = testMode
          ? 0
          : rules.send_immediately || rules.delay_minutes <= 0
            ? 0
            : rules.delay_minutes * 60 * 1000
        passed = true
        reason =
          delayMs > 0
            ? `scheduled_in_${rules.delay_minutes}m`
            : testMode
              ? "instant_test_mode"
              : "no_delay"
        output = {
          delay_minutes: rules.delay_minutes,
          simulated: testMode,
          waited_ms: delayMs,
        }
        logs.push(
          makeLog(
            "delay",
            "Delay",
            testMode
              ? `Simulated ${rules.delay_minutes}m delay instantly`
              : delayMs > 0
                ? `Scheduled for ${rules.delay_minutes} minutes`
                : "Proceeding immediately",
            nowMs() - stepStart,
            "info",
            { output }
          )
        )
        break
      }
      case "send": {
        if (!source.templates) {
          passed = false
          reason = "no_template"
          status = "failure"
          halted = true
          finalStatus = "failed"
        } else {
          passed = true
          reason = "delivery_queued"
          output = {
            template_id: source.templates.id,
            template_name: source.templates.name,
            status: testMode ? "simulated_sent" : "queued",
            to: user?.email ?? null,
          }
        }
        logs.push(
          makeLog(
            "send",
            "Send Template",
            passed
              ? `Template "${source.templates?.name}" ${testMode ? "simulated" : "queued"}`
              : "No template configured",
            nowMs() - stepStart,
            passed ? "success" : "error",
            { output }
          )
        )
        if (!passed) break
        break
      }
      case "goal": {
        passed = true
        reason = "goal_recorded"
        output = { conversion: true, event_type: source.event_type }
        logs.push(
          makeLog(
            "goal",
            "Goal",
            "Conversion goal recorded",
            nowMs() - stepStart,
            "success",
            { output }
          )
        )
        break
      }
    }

    steps.push({
      node_id: nodeIdForKind(kind),
      kind,
      status,
      passed,
      reason,
      duration_ms: nowMs() - stepStart,
      output,
    })
  }

  const success = finalStatus === "completed"
  return {
    execution_id: executionId,
    automation_id: source.id,
    automation_name: source.name,
    event_type: event.type,
    test_mode: testMode,
    started_at: new Date(started).toISOString(),
    completed_at: new Date().toISOString(),
    success,
    steps,
    logs,
    final_status: finalStatus,
    idempotency_key: `${event.source ?? "api"}:${event.message_id ?? executionId}`,
  }
}

function nodeIdForKind(kind: WorkflowNodeKind): string {
  if (kind === "frequency") return "frequency"
  return kind
}

function checkFrequencyCap(
  rules: DeliveryRules,
  sendOnce: boolean,
  ctx: { aggregates?: Record<string, unknown> }
): {
  passed: boolean
  reason: string
  message: string
  output: Record<string, unknown>
} {
  const sent = Number(ctx.aggregates?.emails_sent_last_7_days ?? 0)
  const max = rules.max_sends_per_user

  if (sendOnce || rules.mode === "once_per_user") {
    if (sent >= 1) {
      return {
        passed: false,
        reason: "already_sent_once",
        message: "Frequency cap: user already received this automation",
        output: { mode: "once_per_user", emails_sent: sent },
      }
    }
  }

  if (max != null && sent >= max) {
    return {
      passed: false,
      reason: "max_sends_exceeded",
      message: `Frequency cap: max ${max} sends reached`,
      output: { max_sends: max, emails_sent: sent },
    }
  }

  if (rules.mode === "cooldown" && rules.cooldown_days > 0 && sent > 0) {
    return {
      passed: false,
      reason: "cooldown_active",
      message: `Cooldown active (${rules.cooldown_days} days)`,
      output: { cooldown_days: rules.cooldown_days, emails_sent: sent },
    }
  }

  return {
    passed: true,
    reason: "under_cap",
    message: "Frequency cap passed",
    output: { mode: rules.mode, emails_sent: sent },
  }
}
