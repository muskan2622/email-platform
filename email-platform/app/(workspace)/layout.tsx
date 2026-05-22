import { AppShell } from "@/components/layout/app-shell"
import { PlatformDataProvider } from "@/components/providers/platform-data-provider"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlatformDataProvider pollMs={15000}>
      <AppShell>{children}</AppShell>
    </PlatformDataProvider>
  )
}
