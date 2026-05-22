import { AppShell } from "@/components/layout/app-shell"
import { PlatformDataProvider } from "@/components/providers/platform-data-provider"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlatformDataProvider>
      <AppShell>{children}</AppShell>
    </PlatformDataProvider>
  )
}
