"use client"

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { Loader2, Maximize2, Play } from "lucide-react"
import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { GlassCard } from "@/components/motion/glass-card"
import { ExecutionDebugger } from "@/components/rules/execution-debugger"
import { WorkflowInspector } from "@/components/rules/workflow-inspector"
import {
  workflowNodeTypes,
  type WorkflowGraphNode,
} from "@/components/rules/workflow-node"
import { Button } from "@/components/ui/button"
import { buildWorkflowGraph } from "@/lib/workflow/build-graph"
import type { WorkflowAutomationSource, WorkflowExecutionResult } from "@/lib/workflow/types"
import type { WorkflowNodeStatus } from "@/lib/workflow/types"

const flowCanvasClass = "workflow-canvas h-full w-full"
const flowControlsClass =
  "!border !border-white/10 !bg-black/45 !shadow-none [&_.react-flow__controls-button]:!border-white/10 [&_.react-flow__controls-button]:!bg-black/60 [&_.react-flow__controls-button]:!text-white [&_.react-flow__controls-button:hover]:!bg-black/80"
const canvasToolbarButtonClass =
  "border-white/10 bg-black/30 text-flow hover:bg-black/45 dark:border-white/10 dark:bg-black/30 dark:hover:bg-black/45"

function applyNodeStatuses(
  nodes: WorkflowGraphNode[],
  statuses: Record<string, WorkflowNodeStatus>,
  activeId: string | null
): WorkflowGraphNode[] {
  return nodes.map((node) => {
    const override = statuses[node.id]
    const status = activeId === node.id && override === "running"
      ? "running"
      : override ?? node.data.status
    return {
      ...node,
      data: { ...node.data, status },
    }
  })
}

function applyEdgeAnimation(edges: Edge[], activeEdgeIds: string[]): Edge[] {
  return edges.map((edge) => ({
    ...edge,
    animated: activeEdgeIds.includes(edge.id) || edge.animated,
    style: activeEdgeIds.includes(edge.id)
      ? { stroke: "#a78bfa", strokeWidth: 3 }
      : edge.style,
  }))
}

export function WorkflowCanvas({
  source,
  onRunTest,
  runningTest,
  execution,
  activeNodeId,
  nodeStatuses,
  activeEdgeIds,
  executionLogs,
}: {
  source: WorkflowAutomationSource
  onRunTest: () => Promise<void>
  runningTest: boolean
  execution: WorkflowExecutionResult | null
  activeNodeId: string | null
  nodeStatuses: Record<string, WorkflowNodeStatus>
  activeEdgeIds: string[]
  executionLogs: WorkflowExecutionResult["logs"]
}) {
  const graph = useMemo(() => buildWorkflowGraph(source), [source])
  const [selectedNodeId, setSelectedNodeId] = useState("trigger")
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<WorkflowGraphNode, Edge> | null>(
    null
  )

  const displayNodes = useMemo(
    () => applyNodeStatuses(graph.nodes, nodeStatuses, activeNodeId),
    [graph.nodes, nodeStatuses, activeNodeId]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(displayNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges as Edge[])

  useEffect(() => {
    setNodes(displayNodes)
    setEdges(applyEdgeAnimation(graph.edges as Edge[], activeEdgeIds))
  }, [displayNodes, graph.edges, activeEdgeIds, setNodes, setEdges])

  useEffect(() => {
    setSelectedNodeId("trigger")
  }, [source.id])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? nodes[0]

  const fitCanvas = useCallback(() => {
    void flowInstance?.fitView({ padding: 0.2, duration: 500 })
  }, [flowInstance])

  useEffect(() => {
    if (!flowInstance) return
    const frame = requestAnimationFrame(() => {
      flowInstance.fitView({ padding: 0.2, duration: 400 })
    })
    return () => cancelAnimationFrame(frame)
  }, [flowInstance, source.id])

  useEffect(() => {
    if (activeNodeId) setSelectedNodeId(activeNodeId)
  }, [activeNodeId])

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <GlassCard className="glass-panel-canvas min-h-[720px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-flow-glass-faint px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-flow-faint">Automation Canvas</p>
            <h2 className="text-lg font-semibold text-flow">{source.name}</h2>
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
            nodeTypes={workflowNodeTypes as import("@xyflow/react").NodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onInit={setFlowInstance}
            minZoom={0.35}
            maxZoom={1.35}
            defaultEdgeOptions={{ animated: true }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="rgba(255,255,255,0.08)" gap={24} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) =>
                node.id === activeNodeId || node.id === selectedNodeId
                  ? "#22d3ee"
                  : "#6d28d9"
              }
              className="!border !border-white/10 !bg-black/40"
            />
            <Controls className={flowControlsClass} />
          </ReactFlow>
          {runningTest && activeNodeId ? (
            <motion.div
              layoutId="execution-pulse"
              className="pointer-events-none absolute inset-0 rounded-b-2xl ring-1 ring-cyan-400/20"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          ) : null}
        </div>
      </GlassCard>

      <aside className="space-y-4">
        <WorkflowInspector node={selectedNode} execution={execution} />
        <ExecutionDebugger
          logs={executionLogs}
          running={runningTest}
          focusedNodeId={selectedNodeId}
          onLogClick={(nodeId) => {
            setSelectedNodeId(nodeId)
            const node = nodes.find((n) => n.id === nodeId)
            if (node && flowInstance) {
              flowInstance.setCenter(node.position.x + 110, node.position.y + 40, {
                zoom: 1,
                duration: 400,
              })
            }
          }}
        />
      </aside>
    </div>
  )
}
