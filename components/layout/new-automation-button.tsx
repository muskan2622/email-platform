"use client"

import { MagneticButton } from "@/components/motion/magnetic-button"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"

export function NewAutomationButton({ className }: { className?: string }) {
  const openWizard = useAutomationWizardStore((s) => s.openWizard)

  return (
    <MagneticButton className={className} onClick={() => openWizard(1)}>
      New automation
    </MagneticButton>
  )
}
