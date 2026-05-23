"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Check, Eye, FileText, Loader2, Search } from "lucide-react"
import { TemplatePreviewModal } from "@/components/automation-builder/modals/template-preview-modal"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { useAutomationWizardStore } from "@/lib/stores/automation-wizard-store"
import type { Template } from "@/lib/types/database"
import { cn } from "@/lib/utils"

export function TemplateStep() {
  const { data, loading, error } = usePlatformDataContext()
  const { draft, patchDraft, validationErrors, pushHistory } = useAutomationWizardStore()
  const [search, setSearch] = useState("")
  const [preview, setPreview] = useState<Template | null>(null)

  const templates = data?.templates ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return templates
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
    )
  }, [templates, search])

  const selectTemplate = (id: string) => {
    pushHistory()
    patchDraft({ template_id: id })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-flow">Pick an email template</h2>
        <p className="mt-1 text-sm text-flow-muted">
          Choose the message sent when this automation runs.
        </p>
      </div>

      {validationErrors.template_id && (
        <p className="text-sm text-rose-400" role="alert">
          {validationErrors.template_id}
        </p>
      )}

      {validationErrors.save && (
        <p className="text-sm text-amber-300" role="status">
          {validationErrors.save}
        </p>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-faint" />
        <input
          type="search"
          placeholder="Search templates…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-flow-glass bg-flow-glass-subtle py-2.5 pl-10 pr-4 text-sm text-flow outline-none focus:border-violet-500/50"
          aria-label="Search templates"
        />
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-flow-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading templates…
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-400">Could not load templates: {error}</p>
      )}

      <div className="grid max-h-[min(52vh,520px)] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {filtered.map((t) => {
          const selected = draft.template_id === t.id
          return (
            <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button
                type="button"
                onClick={() => selectTemplate(t.id)}
                aria-pressed={selected}
                className={cn(
                  "relative w-full rounded-2xl border p-4 text-left transition-all",
                  "bg-flow-glass-subtle/80 backdrop-blur-sm",
                  selected
                    ? "border-violet-500/60 ring-2 ring-violet-500/40 shadow-[0_0_32px_-8px_rgba(139,92,246,0.45)]"
                    : "border-flow-glass hover:border-violet-500/30"
                )}
              >
                {selected && (
                  <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 pr-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                      t.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    )}
                  >
                    {t.status}
                  </span>
                </div>
                <h3 className="mt-3 font-medium text-flow">{t.name}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-flow-muted">{t.subject}</p>
                <p className="mt-2 font-mono text-[10px] text-flow-faint">
                  Updated {new Date(t.updated_at).toLocaleDateString()}
                </p>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreview(t)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      e.stopPropagation()
                      setPreview(t)
                    }
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </span>
              </button>
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <p className="text-center text-sm text-flow-muted">
          No templates found. Create a template first, then return to this step.
        </p>
      )}

      {draft.template_id && (
        <p className="text-center text-xs text-violet-300/90">
          Template selected — you can continue to delivery rules.
        </p>
      )}

      <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
