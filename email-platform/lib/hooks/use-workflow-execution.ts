"use client"

import { useCallback, useRef, useState } from "react"
import { apiPost } from "@/lib/api/client"
import type { IncomingEvent } from "@/lib/types/database"
import type {
  ExecutionLogEntry,
  WorkflowExecutionResult,
  WorkflowNodeStatus,
} from "@/lib/workflow/types"

const STEP_DELAY_MS = 380

export function useWorkflowExecution() {
  const [running, setRunning] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, WorkflowNodeStatus>>({})
  const [activeEdgeIds, setActiveEdgeIds] = useState<string[]>([])
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([])
  const [result, setResult] = useState<WorkflowExecutionResult | null>(null)
  const abortRef = useRef(false)

  const reset = useCallback(() => {
    abortRef.current = true
    setRunning(false)
    setActiveNodeId(null)
    setNodeStatuses({})
    setActiveEdgeIds([])
    setLogs([])
    setResult(null)
  }, [])

  const run = useCallback(
    async (params: {
      automationId?: string
      triggerId?: string
      event: IncomingEvent
    }) => {
      abortRef.current = false
      setRunning(true)
      setActiveNodeId(null)
      setNodeStatuses({})
      setActiveEdgeIds([])
      setLogs([])
      setResult(null)

      try {
        const execution = await apiPost<WorkflowExecutionResult>("/api/workflows/execute", {
          automation_id: params.automationId,
          trigger_id: params.triggerId,
          event: params.event,
          test_mode: true,
        })

        if (abortRef.current) return execution

        setResult(execution)

        const edgeOrder = [
          "e-trigger-condition",
          "e-condition-frequency",
          "e-frequency-delay",
          "e-delay-send",
          "e-send-goal",
        ]

        for (let i = 0; i < execution.steps.length; i++) {
          if (abortRef.current) break
          const step = execution.steps[i]
          const nodeId = step.node_id

          setActiveNodeId(nodeId)
          setNodeStatuses((prev) => ({
            ...prev,
            [nodeId]: "running",
          }))

          if (i > 0) {
            setActiveEdgeIds((prev) => [...prev, edgeOrder[i - 1] ?? `edge-${i}`])
          }

          await sleep(STEP_DELAY_MS)

          const finalStatus: WorkflowNodeStatus = step.passed
            ? step.status === "skipped"
              ? "skipped"
              : "success"
            : "failure"

          setNodeStatuses((prev) => ({
            ...prev,
            [nodeId]: finalStatus,
          }))

          const stepLogs = execution.logs.filter((l) => l.node_id === nodeId)
          if (stepLogs.length) {
            setLogs((prev) => [...prev, ...stepLogs])
          }
        }

        setActiveNodeId(null)
        return execution
      } finally {
        if (!abortRef.current) setRunning(false)
      }
    },
    []
  )

  return {
    running,
    activeNodeId,
    nodeStatuses,
    activeEdgeIds,
    logs,
    result,
    run,
    reset,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
