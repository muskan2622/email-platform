"use client"

import dynamic from "next/dynamic"
import { LoadingState } from "@/components/ui/loading-state"

const AutomationWizard = dynamic(
  () =>
    import("@/components/automation-builder/automation-wizard").then(
      (m) => m.AutomationWizard
    ),
  { ssr: false, loading: () => null }
)

export function AutomationWizardHost() {
  return <AutomationWizard />
}
