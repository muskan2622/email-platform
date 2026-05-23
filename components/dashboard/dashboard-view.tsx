"use client"

import { TopNavbar } from "@/components/layout/top-navbar"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { HeroSection } from "@/components/dashboard/hero-section"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { AnimatedChart } from "@/components/dashboard/animated-chart"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container"

export function DashboardView() {
  const { error } = usePlatformDataContext()
  return (
    <>
      <TopNavbar title="Command Center" subtitle="Live data from Supabase" />
      {error ? (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <HeroSection />
        </StaggerItem>
        <StaggerItem>
          <MetricCards />
        </StaggerItem>
        <div className="grid gap-6 lg:grid-cols-3">
          <StaggerItem className="lg:col-span-2">
            <AnimatedChart />
          </StaggerItem>
          <StaggerItem>
            <ActivityFeed />
          </StaggerItem>
        </div>
      </StaggerContainer>
    </>
  )
}
