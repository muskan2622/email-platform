"use client"

import { AmbientBackground } from "@/components/background/ambient-background"
import { FloatingDock } from "@/components/layout/floating-dock"
import { FloatingSidebar } from "@/components/layout/floating-sidebar"
import { SpotlightCursor } from "@/components/motion/spotlight-cursor"
import { AiAssistant } from "@/components/ai/ai-assistant"
import { AutomationWizardHost } from "@/components/automation-builder/automation-wizard-host"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-flow">
      <AmbientBackground />
      <SpotlightCursor />
      <FloatingSidebar />
      <main className="relative z-10 min-h-screen pb-24 pl-0 md:pl-[100px] lg:pl-[248px]">
        <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-8 md:py-6">{children}</div>
      </main>
      <FloatingDock />
      <AiAssistant />
      <AutomationWizardHost />
    </div>
  )
}
