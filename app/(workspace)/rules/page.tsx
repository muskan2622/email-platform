import dynamic from "next/dynamic"
import { Suspense } from "react"
import { LoadingState } from "@/components/ui/loading-state"

const WorkflowBuilder = dynamic(
  () => import("@/components/rules/workflow-builder").then((mod) => mod.WorkflowBuilder),
  {
    loading: () => <LoadingState rows={6} />,
  }
)

export default function RulesPage() {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <WorkflowBuilder />
    </Suspense>
  )
}
