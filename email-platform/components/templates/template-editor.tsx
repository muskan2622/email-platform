"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"
import { Bold, Italic, Link2, Sparkles, Wand2, Save, Loader2 } from "lucide-react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { AiAssistant } from "@/components/ai/ai-assistant"
import { MagneticButton } from "@/components/motion/magnetic-button"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { apiPatch } from "@/lib/api/client"
import type { Template } from "@/lib/types/database"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"

function editorBody(t: Template) {
  return t.body_text?.trim() || t.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function TemplateEditor() {
  const { data, loading, error, refresh } = usePlatformDataContext()
  const templates = data?.templates ?? []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0]

  useEffect(() => {
    if (templates.length && !selectedId) {
      setSelectedId(templates[0].id)
    }
  }, [templates, selectedId])

  useEffect(() => {
    if (selected) {
      setSubject(selected.subject)
      setBody(editorBody(selected))
    }
  }, [selected])

  const save = useCallback(async () => {
    if (!selected) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await apiPatch<Template>(`/api/templates/${selected.id}`, {
        subject,
        body_text: body,
        body_html: body.split("\n").map((l) => `<p>${l || "<br/>"}</p>`).join(""),
      })
      setSaveMsg("Saved")
      await refresh()
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }, [selected, subject, body, refresh])

  const previewName = "Alex"

  return (
    <>
      <TopNavbar title="Template Studio" subtitle="Templates from Supabase" />
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <LoadingState rows={4} />
      ) : templates.length === 0 ? (
        <EmptyState
          message="No templates in database"
          hint="Run seed migration or POST /api/templates to create one."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {templates.length > 1 ? (
              <GlassCard className="p-3">
                <label className="mb-2 block text-xs text-flow-faint">Template</label>
                <select
                  value={selected?.id ?? ""}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-xl border border-flow-glass bg-flow-glass-inset px-3 py-2 text-sm text-flow"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} className="bg-[var(--flow-page-bg-end)]">
                      {t.name} ({t.slug})
                    </option>
                  ))}
                </select>
              </GlassCard>
            ) : null}
            <GlassCard className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-flow-faint">
                  Editor · {selected?.status}
                </span>
                <div className="flex gap-1">
                  {[Bold, Italic, Link2].map((Icon, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-flow-glass text-flow-muted transition-colors hover:bg-flow-glass-subtle hover:text-flow"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
              </div>
              <label className="mb-2 block text-xs text-flow-faint">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mb-4 w-full rounded-xl border border-flow-glass bg-flow-glass-inset px-4 py-2.5 text-sm text-flow outline-none ring-violet-500/30 transition-shadow focus:ring-2"
              />
              <label className="mb-2 block text-xs text-flow-faint">Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full resize-none rounded-xl border border-flow-glass bg-flow-glass-inset px-4 py-3 font-mono text-sm leading-relaxed text-flow-secondary outline-none ring-violet-500/30 transition-shadow focus:ring-2"
              />
              <div className="mt-4 flex items-center gap-2">
                <MagneticButton className="!text-xs" onClick={save}>
                  {saving ? (
                    <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 inline h-3.5 w-3.5" />
                  )}
                  Save to database
                </MagneticButton>
                {saveMsg ? (
                  <span className="text-xs text-flow-muted">{saveMsg}</span>
                ) : null}
              </div>
            </GlassCard>
            <AiAssistant compact subject={subject} body={body} />
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <GlassCard glow className="overflow-hidden p-1">
              <div className="flex items-center gap-2 border-b border-flow-glass-faint px-4 py-3">
                <div className="flex gap-1.5">
                  {["bg-rose-400/80", "bg-amber-400/80", "bg-emerald-400/80"].map((c) => (
                    <span key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="text-xs text-flow-faint">Live preview</span>
                <Sparkles className="ml-auto h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="p-6 md:p-8">
                <motion.div
                  key={subject}
                  initial={{ opacity: 0.5, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 border-b border-flow-glass-faint pb-4"
                >
                  <p className="text-xs text-flow-faint">Subject</p>
                  <p className="mt-1 text-lg font-medium text-flow">
                    {subject.replace(/\{\{first_name\}\}/g, previewName).replace(/\{\{plan_name\}\}/g, "Pro")}
                  </p>
                </motion.div>
                <motion.div
                  key={body}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-flow-secondary"
                >
                  {body.split("\n").map((line, i) => (
                    <p key={i} className="mb-3">
                      {line
                        .replace(/\{\{first_name\}\}/g, previewName)
                        .replace(/\{\{plan_name\}\}/g, "Pro")}
                    </p>
                  ))}
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </>
  )
}
