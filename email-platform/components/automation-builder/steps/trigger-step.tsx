"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Radio, Search, Zap } from "lucide-react"
import type { TriggerCategory } from "@/lib/automation/trigger-catalog"
import { useAutomationCatalog } from "@/lib/hooks/use-automation-catalog"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"
import { cn } from "@/lib/utils"

export function TriggerStep() {
  const { draft, patchDraft } = useAutomationWizardStore()
  const { loading, categories, eventTypes } = useAutomationCatalog()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<TriggerCategory | "all">("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return eventTypes.filter((t) => {
      if (category !== "all" && t.category !== category) return false
      if (!q) return true
      return (
        t.label.toLowerCase().includes(q) ||
        t.event.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      )
    })
  }, [search, category, eventTypes])

  const grouped = useMemo(() => {
    const map = new Map<TriggerCategory, typeof filtered>()
    for (const t of filtered) {
      const list = map.get(t.category) ?? []
      list.push(t)
      map.set(t.category, list)
    }
    return map
  }, [filtered])

  const categoryKeys = Object.keys(categories) as TriggerCategory[]

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    )
  }

  if (eventTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        No event types configured. Run the{" "}
        <code className="rounded bg-black/20 px-1">event_catalog</code> migration and seed
        script in Supabase.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-flow">Choose a trigger</h2>
        <p className="mt-1 text-sm text-flow-muted">
          Select the event that starts this automation. Events stream in realtime from your product.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-faint" />
          <input
            type="search"
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-flow-glass bg-flow-glass-subtle py-2.5 pl-10 pr-4 text-sm text-flow outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            aria-label="Search triggers"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              category === "all"
                ? "bg-violet-500/25 text-violet-200"
                : "text-flow-muted hover:text-flow"
            )}
          >
            All
          </button>
          {categoryKeys.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                category === cat
                  ? "bg-violet-500/25 text-violet-200"
                  : "text-flow-muted hover:text-flow"
              )}
            >
              {categories[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[min(52vh,520px)] space-y-8 overflow-y-auto pr-1">
        {category === "all"
          ? Array.from(grouped.entries()).map(([cat, triggers]) => (
              <section key={cat}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-flow-faint">
                  {categories[cat]}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {triggers.map((t) => (
                    <TriggerCard
                      key={t.id}
                      selected={draft.trigger_event === t.event}
                      onSelect={() => {
                        patchDraft({
                          trigger_event: t.event,
                          name: draft.name || `${t.label} automation`,
                        })
                      }}
                      {...t}
                    />
                  ))}
                </div>
              </section>
            ))
          : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((t) => (
                  <TriggerCard
                    key={t.id}
                    selected={draft.trigger_event === t.event}
                    onSelect={() =>
                      patchDraft({
                        trigger_event: t.event,
                        name: draft.name || `${t.label} automation`,
                      })
                    }
                    {...t}
                  />
                ))}
              </div>
            )}
      </div>
    </div>
  )
}

function TriggerCard({
  label,
  event,
  description,
  icon: Icon,
  realtime,
  selected,
  onSelect,
}: {
  label: string
  event: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  realtime: boolean
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative w-full rounded-2xl border p-4 text-left transition-all",
        "bg-flow-glass-subtle/60 backdrop-blur-md",
        selected
          ? "border-violet-500/60 shadow-[0_0_32px_-8px_rgba(139,92,246,0.45)]"
          : "border-flow-glass hover:border-flow-glass-hover"
      )}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            selected ? "bg-violet-500/30 text-violet-200" : "bg-flow-glass-subtle text-flow-muted"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-flow">{label}</span>
            {realtime && (
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300">
                <Radio className="h-3 w-3" />
                Live
              </span>
            )}
          </div>
          <code className="mt-1 block truncate font-mono text-xs text-flow-faint">{event}</code>
          <p className="mt-2 line-clamp-2 text-xs text-flow-muted">{description}</p>
        </div>
        {selected && <Zap className="h-4 w-4 shrink-0 text-violet-400" />}
      </div>
    </motion.button>
  )
}
