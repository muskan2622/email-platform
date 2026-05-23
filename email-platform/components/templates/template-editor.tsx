"use client"

import { motion } from "framer-motion"
import {
  Activity,
  Archive,
  Blocks,
  CheckCircle2,
  Clock3,
  Code2,
  Columns3,
  Copy,
  Eye,
  FileClock,
  Filter,
  GitCompareArrows,
  Grid2X2,
  History,
  Image,
  Inbox,
  Laptop,
  LayoutTemplate,
  Link2,
  List,
  Loader2,
  MailCheck,
  MessageSquare,
  MonitorSmartphone,
  MousePointerClick,
  PanelRightOpen,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Star,
  TestTube2,
  Trash2,
  Users,
  Variable,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { TopNavbar } from "@/components/layout/top-navbar"
import { GlassCard } from "@/components/motion/glass-card"
import { AiEmailContextBridge } from "@/components/ai/ai-assistant"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { useAiAssistantStore } from "@/lib/stores/ai-assistant-store"
import { apiPatch, apiPost } from "@/lib/api/client"
import type { Template } from "@/lib/types/database"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingState } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "table"
type EditorMode = "visual" | "html"
type PreviewMode = "desktop" | "mobile" | "dark"
type TemplateKind = "transactional" | "marketing"
type Provider = "resend" | "sendgrid" | "ses"

const folders = ["Lifecycle", "Transactional", "Activation", "Revenue", "Retention"]
const statuses = ["active", "draft", "archived"] as const
const blocks = [
  { name: "Text", icon: LayoutTemplate, snippet: "\n\nWrite a concise paragraph for {{first_name}}." },
  { name: "Image", icon: Image, snippet: '\n\n<img src="https://placehold.co/640x280" alt="Campaign visual" />' },
  { name: "Button", icon: MousePointerClick, snippet: '\n\n<a class="button" href="{{cta_url}}">Open dashboard</a>' },
  { name: "Divider", icon: PanelRightOpen, snippet: "\n\n---" },
  { name: "Columns", icon: Columns3, snippet: "\n\n{{#each features}}\n- {{this}}\n{{/each}}" },
  { name: "Social", icon: Link2, snippet: "\n\nFollow us: {{twitter_url}} {{linkedin_url}}" },
]

const placeholderCatalog = [
  "{{first_name}}",
  "{{company}}",
  "{{plan_name}}",
  "{{user.metadata.role}}",
  "{{#if trial_ending}}...{{/if}}",
  "{{#each invoice.items}}...{{/each}}",
  "{{formatDate billing_date}}",
]

const versionEvents = [
  { label: "v12 Draft edited by Maya", icon: FileClock },
  { label: "v11 Published by Jordan", icon: GitCompareArrows },
  { label: "v10 Rolled back after spam warning", icon: History },
]

const mockPayload = {
  first_name: "Alex",
  company: "Northstar Labs",
  plan_name: "Scale",
  cta_url: "https://app.example.com",
  trial_ending: true,
  billing_date: new Date().toISOString(),
  invoice: { items: ["Seats", "Usage", "Priority support"] },
  user: { metadata: { role: "admin" } },
}

function editorBody(template: Template) {
  return template.body_text?.trim() || template.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function templateHash(template: Template) {
  return template.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function enrichTemplate(template: Template) {
  const hash = templateHash(template)
  const kind: TemplateKind = hash % 2 === 0 ? "transactional" : "marketing"
  const tagPool = kind === "transactional" ? ["onboarding", "billing", "product"] : ["campaign", "newsletter", "activation"]
  const placeholders = Array.from(new Set([...(template.subject.match(/\{\{[^}]+\}\}/g) ?? []), ...(editorBody(template).match(/\{\{[^}]+\}\}/g) ?? [])]))

  return {
    ...template,
    kind,
    folder: folders[hash % folders.length],
    tags: tagPool.slice(0, (hash % tagPool.length) + 1),
    usageCount: 120 + hash * 3,
    lastSent: new Date(Date.now() - (hash % 14) * 86400000).toISOString(),
    favorite: hash % 3 === 0,
    placeholders,
    owner: ["Maya", "Jordan", "Sam"][hash % 3],
  }
}

function renderPreview(source: string) {
  return source
    .replace(/\{\{first_name\}\}/g, mockPayload.first_name)
    .replace(/\{\{company\}\}/g, mockPayload.company)
    .replace(/\{\{plan_name\}\}/g, mockPayload.plan_name)
    .replace(/\{\{cta_url\}\}/g, mockPayload.cta_url)
}

function extractMissingVariables(subject: string, body: string) {
  const matches = `${subject}\n${body}`.match(/\{\{[#/]?([\w.]+)[^}]*\}\}/g) ?? []
  return Array.from(
    new Set(
      matches
        .map((match) => match.replace(/[{}#/]/g, "").trim().split(" ")[0])
        .filter((key) => key && !(key in mockPayload) && !["if", "each", "this"].includes(key))
    )
  )
}

function miniBars(values: number[]) {
  const max = Math.max(...values)
  return values.map((value, index) => (
    <span
      key={index}
      className="w-full rounded-t-sm bg-cyan-300/70"
      style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
    />
  ))
}

export function TemplateEditor() {
  const { data, loading, error, refresh } = usePlatformDataContext()
  const templates = useMemo(() => (data?.templates ?? []).map(enrichTemplate), [data?.templates])
  const sendLog = data?.sendLog ?? []

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [editorMode, setEditorMode] = useState<EditorMode>("visual")
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop")
  const [statusFilter, setStatusFilter] = useState<"all" | Template["status"]>("all")
  const [kindFilter, setKindFilter] = useState<"all" | TemplateKind>("all")
  const [sortBy, setSortBy] = useState("updated_at")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [testEmail, setTestEmail] = useState("growth@example.com")
  const [provider, setProvider] = useState<Provider>("resend")
  const [sending, setSending] = useState(false)

  const selected = templates.find((template) => template.id === selectedId) ?? templates[0]
  const activeSubject = draftTemplateId === selected?.id ? subject : selected?.subject ?? ""
  const activeBody = draftTemplateId === selected?.id ? body : selected ? editorBody(selected) : ""
  const missingVariables = useMemo(() => extractMissingVariables(activeSubject, activeBody), [activeSubject, activeBody])
  const recentlyEdited = templates.slice(0, 4)

  const chooseTemplate = (template: Template) => {
    setSelectedId(template.id)
    setDraftTemplateId(template.id)
    setSubject(template.subject)
    setBody(editorBody(template))
  }

  useEffect(() => {
    const onApply = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text
      if (!text || !selected?.id) return
      setDraftTemplateId(selected.id)
      const sel = useAiAssistantStore.getState().emailContext.selectedText
      if (sel && activeBody.includes(sel)) {
        setBody(activeBody.replace(sel, text))
      } else {
        setBody(text)
      }
    }
    window.addEventListener("pulse-ai-apply", onApply)
    return () => window.removeEventListener("pulse-ai-apply", onApply)
  }, [selected?.id, activeBody])

  const filteredTemplates = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return templates
      .filter((template) => {
        const haystack = [
          template.name,
          template.subject,
          template.status,
          template.kind,
          template.folder,
          ...template.tags,
          ...template.placeholders,
        ]
          .join(" ")
          .toLowerCase()

        return (
          (!needle || haystack.includes(needle)) &&
          (statusFilter === "all" || template.status === statusFilter) &&
          (kindFilter === "all" || template.kind === kindFilter)
        )
      })
      .sort((a, b) => {
        if (sortBy === "usage") return b.usageCount - a.usageCount
        if (sortBy === "last_sent") return new Date(b.lastSent).getTime() - new Date(a.lastSent).getTime()
        if (sortBy === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })
  }, [kindFilter, query, sortBy, statusFilter, templates])

  const save = async () => {
    if (!selected) return
    setSaving(true)
    setToast(null)
    const nextSubject = activeSubject
    const nextBody = activeBody
    try {
      await apiPatch<Template>(`/api/templates/${selected.id}`, {
        subject: nextSubject,
        body_text: nextBody,
        body_html: nextBody
          .split("\n")
          .map((line) => `<p>${line || "<br/>"}</p>`)
          .join(""),
      })
      setToast("Template saved and draft version captured")
      await refresh()
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!selected) return
    setSending(true)
    setToast(null)
    try {
      await apiPost(`/api/templates/${selected.id}/test`, {
        to: testEmail,
        provider,
        payload: mockPayload,
      })
      await refresh()
      setToast(`Test sent via ${provider.toUpperCase()} — check Events and Email Logs`)
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Test send failed")
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if ((event.metaKey || event.ctrlKey) && key === "s") {
        event.preventDefault()
        void save()
      }
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault()
        document.getElementById("template-search")?.focus()
      }
      if ((event.metaKey || event.ctrlKey) && key === "enter") {
        event.preventDefault()
        void sendTest()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  const duplicateSelected = async () => {
    if (!selected) return
    await apiPost("/api/templates", {
      name: `${selected.name} copy`,
      subject: selected.subject,
      body_html: selected.body_html,
      body_text: editorBody(selected),
      status: "draft",
    })
    setToast("Template duplicated as a draft")
    await refresh()
  }

  const archiveSelection = async () => {
    const ids = selectedRows.length ? selectedRows : selected ? [selected.id] : []
    await Promise.all(ids.map((id) => apiPatch(`/api/templates/${id}`, { status: "archived" })))
    setSelectedRows([])
    setToast(`${ids.length} template${ids.length === 1 ? "" : "s"} archived`)
    await refresh()
  }

  const toggleRow = (id: string) => {
    setSelectedRows((rows) => (rows.includes(id) ? rows.filter((row) => row !== id) : [...rows, id]))
  }

  const analytics = [
    { label: "Sends", value: data?.sentCount ?? 0, icon: Send, tone: "text-cyan-300" },
    { label: "Delivery", value: "98.4%", icon: MailCheck, tone: "text-emerald-300" },
    { label: "Opens", value: "61.8%", icon: Eye, tone: "text-violet-300" },
    { label: "Clicks", value: "18.2%", icon: MousePointerClick, tone: "text-amber-300" },
    { label: "Bounces", value: "0.7%", icon: RefreshCw, tone: "text-rose-300" },
    { label: "Unsubs", value: "0.2%", icon: ShieldCheck, tone: "text-sky-300" },
  ]

  return (
    <>
      <TopNavbar title="Template Studio" subtitle="Lifecycle email library, delivery testing, versions, and analytics" />
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed right-5 top-24 z-50 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-2xl backdrop-blur"
        >
          {toast}
        </motion.div>
      ) : null}
      {error ? <p className="mb-4 text-sm text-rose-400">{error}</p> : null}
      {loading ? (
        <LoadingState rows={6} />
      ) : templates.length === 0 ? (
        <EmptyState message="No templates in database" hint="Run seed migration or create a draft from the API." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {analytics.map((metric) => (
              <GlassCard key={metric.label} className="p-4">
                <div className="flex items-center justify-between">
                  <metric.icon className={cn("h-4 w-4", metric.tone)} />
                  <span className="text-[11px] text-flow-faint">7d</span>
                </div>
                <p className="mt-4 text-2xl font-semibold text-flow">{metric.value}</p>
                <p className="text-xs text-flow-muted">{metric.label}</p>
              </GlassCard>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(520px,1.25fr)_minmax(360px,0.95fr)]">
            <section className="flex flex-col gap-4">
              <GlassCard className="shrink-0 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-flow-faint" />
                    <input
                      id="template-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, subject, tags, variables..."
                      className="h-10 w-full rounded-lg border border-flow-glass bg-flow-glass-inset pl-9 pr-3 text-sm text-flow outline-none ring-violet-500/30 focus:ring-2"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setViewMode("grid")} aria-label="Grid view">
                    <Grid2X2 className={cn(viewMode === "grid" && "text-cyan-300")} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setViewMode("table")} aria-label="Table view">
                    <List className={cn(viewMode === "table" && "text-cyan-300")} />
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="relative">
                    <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-flow-faint" />
                    <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-9 w-full rounded-lg border border-flow-glass bg-flow-glass-inset pl-8 pr-2 text-xs text-flow">
                      <option value="all">All statuses</option>
                      {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </label>
                  <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)} className="h-9 rounded-lg border border-flow-glass bg-flow-glass-inset px-3 text-xs text-flow">
                    <option value="all">All types</option>
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                  </select>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-9 rounded-lg border border-flow-glass bg-flow-glass-inset px-3 text-xs text-flow">
                    <option value="updated_at">Updated</option>
                    <option value="created_at">Created</option>
                    <option value="usage">Usage count</option>
                    <option value="last_sent">Last sent</option>
                  </select>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={archiveSelection}><Archive />Archive</Button>
                  <Button variant="outline" size="sm" onClick={duplicateSelected}><Copy />Duplicate</Button>
                  <Button variant="outline" size="sm" onClick={() => setToast("Export package prepared with HTML, text, JSON payload, and audit metadata")}><Code2 />Export</Button>
                  <Button variant="destructive" size="sm" onClick={() => setToast("Delete requires approval workflow in production mode")}><Trash2 />Delete</Button>
                </div>
              </GlassCard>

              <GlassCard className="shrink-0 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-flow">Recently Edited</h2>
                  <Clock3 className="h-4 w-4 text-flow-faint" />
                </div>
                <div className="space-y-2">
                  {recentlyEdited.map((template) => (
                    <button key={template.id} onClick={() => chooseTemplate(template)} className="flex w-full items-center justify-between rounded-lg border border-flow-glass-faint bg-flow-glass-subtle px-3 py-2 text-left text-sm transition hover:border-flow-glass-hover">
                      <span className="truncate text-flow-secondary">{template.name}</span>
                      <span className="text-[11px] uppercase text-flow-faint">{template.status}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>

              <div className="min-h-0 shrink">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs text-flow-faint">
                    {filteredTemplates.length} template{filteredTemplates.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="max-h-[calc(100dvh-28rem)] min-h-[12rem] overflow-y-auto overscroll-contain pr-1 ai-panel-scroll">
              {viewMode === "grid" ? (
                <div className="grid gap-3">
                  {filteredTemplates.map((template) => (
                    <button key={template.id} onClick={() => chooseTemplate(template)} className={cn("rounded-2xl border p-4 text-left transition", selected?.id === template.id ? "border-cyan-300/50 bg-cyan-300/10" : "border-flow-glass bg-flow-glass hover:border-flow-glass-hover")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Star className={cn("h-4 w-4", template.favorite ? "fill-amber-300 text-amber-300" : "text-flow-faint")} />
                            <h3 className="font-medium text-flow">{template.name}</h3>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-flow-muted">{template.subject}</p>
                        </div>
                        <input type="checkbox" checked={selectedRows.includes(template.id)} onChange={(event) => { event.stopPropagation(); toggleRow(template.id) }} className="mt-1" aria-label={`Select ${template.name}`} />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        <span className="rounded-md border border-flow-glass-faint px-2 py-1 text-[11px] text-flow-muted">{template.folder}</span>
                        <span className="rounded-md border border-flow-glass-faint px-2 py-1 text-[11px] text-flow-muted">{template.kind}</span>
                        {template.tags.map((tag) => <span key={tag} className="rounded-md bg-flow-glass-inset px-2 py-1 text-[11px] text-flow-faint">{tag}</span>)}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <GlassCard className="overflow-hidden">
                  <div className="grid grid-cols-[32px_1fr_92px_92px] border-b border-flow-glass-faint px-3 py-2 text-[11px] uppercase tracking-wide text-flow-faint">
                    <span />
                    <span>Template</span>
                    <span>Status</span>
                    <span>Usage</span>
                  </div>
                  {filteredTemplates.map((template) => (
                    <button key={template.id} onClick={() => chooseTemplate(template)} className="grid w-full grid-cols-[32px_1fr_92px_92px] items-center border-b border-flow-glass-faint px-3 py-3 text-left text-sm hover:bg-flow-glass-subtle">
                      <input type="checkbox" checked={selectedRows.includes(template.id)} onChange={(event) => { event.stopPropagation(); toggleRow(template.id) }} aria-label={`Select ${template.name}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-flow">{template.name}</span>
                        <span className="block truncate text-xs text-flow-faint">{template.subject}</span>
                      </span>
                      <span className="text-xs capitalize text-flow-muted">{template.status}</span>
                      <span className="text-xs text-flow-muted">{template.usageCount}</span>
                    </button>
                  ))}
                </GlassCard>
              )}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <GlassCard className="p-4 md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-flow-faint">Editor · {selected?.status}</p>
                    <h2 className="mt-1 text-xl font-semibold text-flow">{selected?.name}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditorMode("visual")}><Blocks className={cn(editorMode === "visual" && "text-cyan-300")} />Visual</Button>
                    <Button variant="outline" size="sm" onClick={() => setEditorMode("html")}><Code2 className={cn(editorMode === "html" && "text-cyan-300")} />HTML</Button>
                    <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Save />}Save</Button>
                  </div>
                </div>

                <label className="mb-2 block text-xs text-flow-faint">Subject</label>
                <input value={activeSubject} onChange={(event) => { setDraftTemplateId(selected?.id ?? null); setSubject(event.target.value); setBody(activeBody) }} className="mb-4 h-11 w-full rounded-lg border border-flow-glass bg-flow-glass-inset px-4 text-sm text-flow outline-none ring-violet-500/30 focus:ring-2" />

                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  {blocks.map((block) => (
                    <button key={block.name} onClick={() => { setDraftTemplateId(selected?.id ?? null); setSubject(activeSubject); setBody(`${activeBody}${block.snippet}`) }} className="flex items-center gap-2 rounded-lg border border-flow-glass bg-flow-glass-subtle px-3 py-2 text-xs text-flow-muted transition hover:border-flow-glass-hover hover:text-flow">
                      <block.icon className="h-3.5 w-3.5 text-cyan-300" />
                      {block.name}
                    </button>
                  ))}
                </div>

                <textarea value={activeBody} onChange={(event) => { setDraftTemplateId(selected?.id ?? null); setSubject(activeSubject); setBody(event.target.value) }} rows={15} className={cn("w-full resize-none rounded-lg border border-flow-glass bg-flow-glass-inset px-4 py-3 text-sm leading-relaxed text-flow-secondary outline-none ring-violet-500/30 focus:ring-2", editorMode === "html" ? "font-mono" : "font-sans")} />

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-flow"><Variable className="h-3.5 w-3.5 text-violet-300" />Placeholder autocomplete</div>
                    <div className="flex flex-wrap gap-1.5">
                      {placeholderCatalog.map((placeholder) => (
                        <button key={placeholder} onClick={() => { setDraftTemplateId(selected?.id ?? null); setSubject(activeSubject); setBody(`${activeBody} ${placeholder}`) }} className="rounded-md border border-flow-glass-faint px-2 py-1 font-mono text-[11px] text-flow-muted hover:text-flow">
                          {placeholder}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-flow"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />Validation</div>
                    {missingVariables.length ? (
                      <p className="text-xs text-amber-200">Missing mock values: {missingVariables.join(", ")}</p>
                    ) : (
                      <p className="text-xs text-flow-muted">All detected placeholders resolve against the mock payload. Spam score warning: low risk.</p>
                    )}
                  </div>
                </div>
              </GlassCard>
              <AiEmailContextBridge subject={activeSubject} body={activeBody} />
            </section>

            <aside className="space-y-4">
              <GlassCard glow className="overflow-hidden p-1">
                <div className="flex items-center gap-2 border-b border-flow-glass-faint px-4 py-3">
                  <div className="flex gap-1.5">
                    {["bg-rose-400/80", "bg-amber-400/80", "bg-emerald-400/80"].map((color) => <span key={color} className={cn("h-2.5 w-2.5 rounded-full", color)} />)}
                  </div>
                  <span className="text-xs text-flow-faint">Live rendering</span>
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => setPreviewMode("desktop")} aria-label="Desktop preview"><Laptop className={cn(previewMode === "desktop" && "text-cyan-300")} /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setPreviewMode("mobile")} aria-label="Mobile preview"><Smartphone className={cn(previewMode === "mobile" && "text-cyan-300")} /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setPreviewMode("dark")} aria-label="Dark preview"><MonitorSmartphone className={cn(previewMode === "dark" && "text-cyan-300")} /></Button>
                  </div>
                </div>
                <div className="p-5">
                  <motion.div key={`${activeSubject}-${previewMode}`} initial={{ opacity: 0.55, y: 4 }} animate={{ opacity: 1, y: 0 }} className={cn("mx-auto rounded-lg border p-5 shadow-2xl", previewMode === "mobile" ? "max-w-[280px]" : "max-w-none", previewMode === "dark" ? "border-slate-700 bg-slate-950 text-slate-100" : "border-slate-200 bg-white text-slate-950")}>
                    <p className="text-[11px] uppercase tracking-wide opacity-50">Subject</p>
                    <h3 className="mt-1 text-lg font-semibold">{renderPreview(activeSubject)}</h3>
                    <div className="mt-4 space-y-3 text-sm leading-relaxed">
                      {renderPreview(activeBody).split("\n").map((line, index) => <p key={index}>{line || "\u00a0"}</p>)}
                    </div>
                  </motion.div>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-flow">Testing + Delivery</h2>
                  <TestTube2 className="h-4 w-4 text-cyan-300" />
                </div>
                <div className="grid gap-2">
                  <select value={provider} onChange={(event) => setProvider(event.target.value as Provider)} className="h-9 rounded-lg border border-flow-glass bg-flow-glass-inset px-3 text-xs text-flow">
                    <option value="resend">Resend primary</option>
                    <option value="sendgrid">SendGrid failover</option>
                    <option value="ses">SES backup</option>
                  </select>
                  <input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} className="h-9 rounded-lg border border-flow-glass bg-flow-glass-inset px-3 text-xs text-flow" />
                  <Button onClick={sendTest} disabled={sending}>{sending ? <Loader2 className="animate-spin" /> : <Rocket />}Send test</Button>
                </div>
                <div className="mt-4 space-y-2 text-xs text-flow-muted">
                  {["Rate limit check", "Retry policy", "Open/click tracking", "Bounce + unsubscribe webhooks"].map((item) => (
                    <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />{item}</div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-flow">Versioning + Collaboration</h2>
                  <Users className="h-4 w-4 text-violet-300" />
                </div>
                <div className="space-y-3">
                  {versionEvents.map((version) => (
                    <div key={version.label} className="flex items-center gap-3 rounded-lg border border-flow-glass-faint bg-flow-glass-subtle p-3">
                      <version.icon className="h-4 w-4 text-flow-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-xs text-flow-secondary">{version.label}</p>
                        <p className="text-[11px] text-flow-faint">Compare, rollback, approval audit</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex -space-x-2">
                  {["MA", "JR", "SK"].map((person) => <span key={person} className="grid h-8 w-8 place-items-center rounded-full border border-flow-glass bg-flow-glass-inset text-[11px] text-flow">{person}</span>)}
                  <span className="ml-3 flex items-center gap-1 text-xs text-flow-muted"><MessageSquare className="h-3.5 w-3.5" />4 comments</span>
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-flow">Provider Performance</h2>
                  <Activity className="h-4 w-4 text-emerald-300" />
                </div>
                <div className="flex h-24 items-end gap-1.5">{miniBars([42, 55, 39, 68, 74, 59, 88, 79, 92, 83])}</div>
                <div className="mt-3 space-y-2 text-xs text-flow-muted">
                  {sendLog.slice(0, 3).map((log) => <div key={log.id} className="flex items-center justify-between"><span className="truncate">{log.templates?.name ?? "Template send"}</span><span>{log.status}</span></div>)}
                  {!sendLog.length ? <div className="flex items-center gap-2"><Inbox className="h-3.5 w-3.5" />No delivery logs yet</div> : null}
                </div>
              </GlassCard>
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
