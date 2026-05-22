"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  Check,
  Command,
  History,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Sparkles,
  Wand2,
  X,
  Zap,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { cn } from "@/lib/utils"
import { useAiChat } from "@/lib/hooks/use-ai-chat"
import { formatRelativeTime } from "@/lib/utils/time"
import {
  AI_TABS,
  QUICK_ACTIONS,
  SLASH_COMMANDS,
  getTabLabel,
  useAiAssistantStore,
  type AiTabId,
} from "@/lib/stores/ai-assistant-store"

const SPRING = { type: "spring" as const, stiffness: 420, damping: 32, mass: 0.85 }
const PANEL_SPRING = { type: "spring" as const, stiffness: 380, damping: 34 }

function usePulseAiChat() {
  const { data } = usePlatformDataContext()
  return useAiChat(data)
}

function PulseLiveStats() {
  const { data, loading, error, lastRefreshed, refresh } = usePlatformDataContext()
  const isOpen = useAiAssistantStore((s) => s.isOpen)

  useEffect(() => {
    if (isOpen) void refresh()
  }, [isOpen, refresh])

  if (loading && !data) {
    return (
      <div className="mx-3 mt-2 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-7 flex-1 animate-pulse rounded-lg bg-white/5"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-3 mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
        Live data unavailable — check Supabase env in .env.local
      </div>
    )
  }

  if (!data) return null

  const stats = [
    { label: "Sent today", value: data.sentToday },
    { label: "Events", value: data.eventsCount },
    { label: "Failed", value: data.failedCount },
    { label: "Triggers", value: data.activeTriggers },
  ]

  return (
    <div className="relative z-10 mx-3 mt-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">
            Live from Supabase
          </span>
        </div>
        {lastRefreshed ? (
          <span className="text-[10px] text-flow-faint">
            {formatRelativeTime(new Date(lastRefreshed).toISOString())}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-white/10 bg-[#12182a]/90 px-2.5 py-1.5"
          >
            <p className="text-[10px] text-flow-faint">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums text-flow">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Floating launcher ─── */

function PulseParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        delay: i * 0.35,
        x: Math.cos((i / 6) * Math.PI * 2) * 28,
        y: Math.sin((i / 6) * Math.PI * 2) * 28,
      })),
    []
  )
  return (
    <>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-cyan-400/80"
          style={{ x: "-50%", y: "-50%" }}
          animate={{
            x: [0, p.x, 0],
            y: [0, p.y, 0],
            opacity: [0, 0.9, 0],
            scale: [0.4, 1.2, 0.4],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
      <span className="pointer-events-none absolute inset-0 rounded-full border border-cyan-400/20 flow-pulse" />
      <span
        className="pointer-events-none absolute inset-[-6px] rounded-full border border-violet-400/15 flow-pulse"
        style={{ animationDelay: "0.6s" }}
      />
    </>
  )
}

function WelcomeBubble() {
  const show = useAiAssistantStore((s) => s.showWelcomeBubble)
  const dismiss = useAiAssistantStore((s) => s.dismissWelcomeBubble)

  useEffect(() => {
    if (!show) return
    const t = setTimeout(dismiss, 4500)
    return () => clearTimeout(t)
  }, [show, dismiss])

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="welcome"
          initial={{ opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -28, scale: 0.9 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute bottom-[calc(100%+14px)] right-0 z-10 max-w-[220px]"
        >
          <div className="relative rounded-2xl border border-cyan-400/25 bg-flow-glass px-3.5 py-2.5 text-xs leading-relaxed text-flow shadow-lg backdrop-blur-md">
            <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-cyan-400/25 bg-flow-glass" />
            Hey 👋 How can I help you today?
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function FloatingPulseButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div className="fixed bottom-24 right-5 z-[60] md:bottom-8 md:right-8">
      <WelcomeBubble />
      <motion.button
        type="button"
        aria-label="Open Pulse AI"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileTap={{ scale: 0.94 }}
        animate={{ scale: hovered ? 1.06 : 1 }}
        transition={SPRING}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
      >
        <PulseParticles />
        <motion.span
          className="absolute inset-0 rounded-full p-[2px] ai-copilot-border-spin opacity-90"
          animate={{ opacity: hovered ? 1 : 0.75 }}
        >
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0a0c14]/90 dark:bg-[#06070d]/95" />
        </motion.span>
        <motion.span
          className="absolute inset-1 rounded-full ai-copilot-glow"
          animate={{
            boxShadow: hovered
              ? "0 0 0 1px rgba(34,211,238,0.25), 0 0 48px -4px rgba(56,189,248,0.65), 0 0 64px -8px rgba(139,92,246,0.5)"
              : undefined,
          }}
        />
        <motion.span
          className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/25 to-blue-500/20"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-5 w-5 text-cyan-200" />
        </motion.span>
      </motion.button>
    </div>
  )
}

/* ─── Onboarding ─── */

function OnboardingWave() {
  return (
    <motion.div
      className="text-3xl"
      animate={{ rotate: [0, 14, -8, 0] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      👋
    </motion.div>
  )
}

/* ─── Chat panel internals ─── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400/70"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-1 text-[11px] text-flow-faint">Pulse is thinking…</span>
    </div>
  )
}

function MessageBubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant" | "system"
  content: string
  streaming?: boolean
}) {
  const isUser = role === "user"
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-gradient-to-br from-violet-600/35 to-cyan-600/25 text-flow border border-violet-400/20"
            : "border border-flow-glass-faint bg-flow-glass-subtle text-flow-secondary"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_strong]:text-cyan-200/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content || " "}</ReactMarkdown>
            {streaming ? (
              <motion.span
                className="ml-0.5 inline-block h-3 w-1 rounded-sm bg-cyan-400/80"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            ) : null}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function DiffPreviewPanel() {
  const diff = useAiAssistantStore((s) => s.diffPreview)
  const setDiff = useAiAssistantStore((s) => s.setDiffPreview)
  const pending = useAiAssistantStore((s) => s.pendingApply)
  const setPending = useAiAssistantStore((s) => s.setPendingApply)

  if (!diff) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mx-3 mb-2 overflow-hidden rounded-xl border border-cyan-500/20 bg-cyan-500/5"
    >
      <div className="flex items-center justify-between border-b border-cyan-500/15 px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-300/80">
          {diff.label ?? "Preview diff"}
        </span>
        <button
          type="button"
          onClick={() => setDiff(null)}
          className="text-flow-faint hover:text-flow"
          aria-label="Close diff"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-cyan-500/10 p-3 sm:border-b-0 sm:border-r">
          <p className="mb-1 text-[10px] uppercase text-flow-faint">Before</p>
          <p className="text-xs leading-relaxed text-flow-muted whitespace-pre-wrap">
            {diff.before}
          </p>
        </div>
        <div className="p-3">
          <p className="mb-1 text-[10px] uppercase text-emerald-300/70">After</p>
          <p className="text-xs leading-relaxed text-flow whitespace-pre-wrap">
            {diff.after}
          </p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-cyan-500/15 p-2.5">
        <Button
          size="xs"
          variant="outline"
          className="border-cyan-500/30 text-cyan-200"
          onClick={() => setDiff(null)}
        >
          Dismiss
        </Button>
        <Button
          size="xs"
          className="bg-gradient-to-r from-cyan-600/80 to-violet-600/80 text-white"
          onClick={() => {
            if (pending) {
              window.dispatchEvent(
                new CustomEvent("pulse-ai-apply", { detail: { text: pending } })
              )
            }
            setPending(null)
            setDiff(null)
          }}
        >
          <Check className="h-3 w-3" />
          Apply changes
        </Button>
      </div>
    </motion.div>
  )
}

function HistorySidebar() {
  const open = useAiAssistantStore((s) => s.historySidebarOpen)
  const conversations = useAiAssistantStore((s) => s.conversations)
  const activeId = useAiAssistantStore((s) => s.activeConversationId)
  const select = useAiAssistantStore((s) => s.selectConversation)
  const create = useAiAssistantStore((s) => s.createConversation)

  if (!open) return null

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 200, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="relative z-10 flex shrink-0 flex-col border-r border-white/10 bg-[#080a12]/95"
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-flow-faint">
          <History className="h-3 w-3" /> History
        </span>
        <button
          type="button"
          onClick={create}
          className="rounded-md px-2 py-0.5 text-[10px] text-cyan-300/90 hover:bg-cyan-500/10"
        >
          New
        </button>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => select(c.id)}
            className={cn(
              "w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
              c.id === activeId
                ? "bg-violet-500/15 text-flow"
                : "text-flow-muted hover:bg-flow-glass-subtle hover:text-flow"
            )}
          >
            <p className="truncate font-medium">{c.title}</p>
            <p className="mt-0.5 truncate text-[10px] text-flow-faint">
              {c.messages.length} messages
            </p>
          </button>
        ))}
      </div>
    </motion.aside>
  )
}

function CommandPalette() {
  const open = useAiAssistantStore((s) => s.commandPaletteOpen)
  const setOpen = useAiAssistantStore((s) => s.setCommandPaletteOpen)
  const setInput = useAiAssistantStore((s) => s.setInputValue)
  const { sendUserMessage } = usePulseAiChat()

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-violet-500/25 bg-[#0c0e18] shadow-2xl"
    >
      <p className="border-b border-flow-glass-faint px-3 py-2 text-[10px] uppercase tracking-wider text-flow-faint">
        Slash commands
      </p>
      <ul className="max-h-48 overflow-y-auto py-1">
        {SLASH_COMMANDS.map((item) => (
          <li key={item.cmd}>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-violet-500/10"
              onClick={() => {
                setInput(item.cmd + " ")
                setOpen(false)
                void sendUserMessage(item.cmd)
              }}
            >
              <Command className="h-3.5 w-3.5 shrink-0 text-violet-300" />
              <span className="font-mono text-cyan-200/90">{item.cmd}</span>
              <span className="ml-auto truncate text-xs text-flow-faint">{item.desc}</span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function ProactiveHintsBar() {
  const hints = useAiAssistantStore((s) => s.proactiveHints)
  const { sendUserMessage } = usePulseAiChat()

  if (!hints.length) return null

  return (
    <div className="relative z-10 flex flex-wrap gap-1.5 px-3 pb-2">
      {hints.map((h) => (
        <motion.button
          key={h.id}
          type="button"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => void sendUserMessage(`Fix: ${h.message}`)}
          className={cn(
            "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
            h.severity === "warning"
              ? "border-amber-400/30 bg-[#1a1510] text-amber-200"
              : "ai-chip-solid text-cyan-100/90"
          )}
        >
          <Zap className="mr-1 inline h-3 w-3" />
          {h.message}
        </motion.button>
      ))}
    </div>
  )
}

function AiChatPanel() {
  const isOpen = useAiAssistantStore((s) => s.isOpen)
  const setOpen = useAiAssistantStore((s) => s.setOpen)
  const isFullscreen = useAiAssistantStore((s) => s.isFullscreen)
  const setFullscreen = useAiAssistantStore((s) => s.setFullscreen)
  const panelWidth = useAiAssistantStore((s) => s.panelWidth)
  const panelHeight = useAiAssistantStore((s) => s.panelHeight)
  const setPanelSize = useAiAssistantStore((s) => s.setPanelSize)
  const activeTab = useAiAssistantStore((s) => s.activeTab)
  const setActiveTab = useAiAssistantStore((s) => s.setActiveTab)
  const input = useAiAssistantStore((s) => s.inputValue)
  const setInput = useAiAssistantStore((s) => s.setInputValue)
  const commandOpen = useAiAssistantStore((s) => s.commandPaletteOpen)
  const setCommandOpen = useAiAssistantStore((s) => s.setCommandPaletteOpen)
  const historyOpen = useAiAssistantStore((s) => s.historySidebarOpen)
  const setHistoryOpen = useAiAssistantStore((s) => s.setHistorySidebarOpen)
  const isTyping = useAiAssistantStore((s) => s.isTyping)
  const hasOnboarding = useAiAssistantStore((s) => s.hasCompletedOnboarding)
  const completeOnboarding = useAiAssistantStore((s) => s.completeOnboarding)
  const selectedText = useAiAssistantStore((s) => s.emailContext.selectedText)
  const conversations = useAiAssistantStore((s) => s.conversations)
  const activeId = useAiAssistantStore((s) => s.activeConversationId)
  const { sendUserMessage } = usePulseAiChat()

  const messages =
    conversations.find((c) => c.id === activeId)?.messages ?? []
  const scrollRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<{ w: number; h: number; x: number; y: number } | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length, isTyping])

  useEffect(() => {
    if (isOpen && !hasOnboarding) {
      const t = setTimeout(completeOnboarding, 3200)
      return () => clearTimeout(t)
    }
  }, [isOpen, hasOnboarding, completeOnboarding])

  const onResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      resizeRef.current = {
        w: panelWidth,
        h: panelHeight,
        x: e.clientX,
        y: e.clientY,
      }
      const onMove = (ev: PointerEvent) => {
        const r = resizeRef.current
        if (!r) return
        setPanelSize(r.w + (r.x - ev.clientX), r.h + (r.y - ev.clientY))
      }
      const onUp = () => {
        resizeRef.current = null
        window.removeEventListener("pointermove", onMove)
        window.removeEventListener("pointerup", onUp)
      }
      window.addEventListener("pointermove", onMove)
      window.addEventListener("pointerup", onUp)
    },
    [panelWidth, panelHeight, setPanelSize]
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void sendUserMessage(input)
  }

  const showOnboarding = isOpen && !hasOnboarding

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[65] ai-overlay-dim"
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Pulse AI"
            initial={{ opacity: 0, scale: 0.88, y: 40, x: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0,
              width: isFullscreen ? "min(100vw - 2rem, 1100px)" : panelWidth,
              height: isFullscreen ? "min(100vh - 2rem, 860px)" : panelHeight,
            }}
            exit={{ opacity: 0, scale: 0.9, y: 24, x: 16 }}
            transition={PANEL_SPRING}
            style={{ transformOrigin: "bottom right" }}
            className={cn(
              "fixed z-[70] flex flex-col overflow-hidden rounded-[28px] border border-cyan-500/25 ai-panel-shell",
              isFullscreen
                ? "bottom-4 right-4 left-4 top-4 mx-auto max-w-none md:left-auto md:top-4"
                : "bottom-24 right-4 max-w-[calc(100vw-2rem)] md:bottom-8 md:right-8"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
              aria-hidden
            >
              <motion.div
                className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-cyan-500/15 blur-3xl"
                animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-violet-500/15 blur-3xl"
                animate={{ x: [0, -24, 0], y: [0, -16, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="absolute inset-x-0 top-0 h-px ai-shimmer-line opacity-40" />
            </div>

            {!isFullscreen ? (
              <button
                type="button"
                aria-label="Resize panel"
                onPointerDown={onResizeStart}
                className="absolute left-2 top-2 z-20 h-4 w-4 cursor-nwse-resize rounded-sm border border-flow-glass-faint opacity-40 hover:opacity-100"
              />
            ) : null}

            <header className="relative flex shrink-0 items-center gap-2 border-b border-flow-glass-faint px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/25 to-violet-600/30">
                <Wand2 className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-flow">Pulse AI</p>
                <p className="truncate text-[11px] text-flow-faint">Campaign copilot</p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setHistoryOpen(!historyOpen)}
                aria-label="Toggle history"
              >
                {historyOpen ? (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </header>

            <div className="relative flex min-h-0 flex-1 ai-panel-inner">
              <AnimatePresence mode="popLayout">{historyOpen ? <HistorySidebar /> : null}</AnimatePresence>

              <div className="flex min-w-0 flex-1 flex-col">
                <PulseLiveStats />
                <div className="relative z-10 shrink-0 overflow-x-auto border-b border-white/10 px-2 py-2 [scrollbar-width:none]">
                  <div className="flex gap-1 pr-2">
                    {AI_TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          activeTab === tab
                            ? "bg-gradient-to-r from-cyan-600/35 to-violet-600/35 text-flow shadow-sm"
                            : "text-flow-muted hover:bg-white/5 hover:text-flow"
                        )}
                      >
                        {getTabLabel(tab)}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedText ? (
                  <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-violet-400/25 bg-violet-500/10 px-2.5 py-1.5 text-[11px] text-violet-200/90">
                    <span className="truncate">
                      Editing selection ({selectedText.length} chars)
                    </span>
                  </div>
                ) : null}

                <ProactiveHintsBar />
                <DiffPreviewPanel />

                <div
                  ref={scrollRef}
                  className="ai-panel-scroll relative z-10 flex-1 space-y-3 overflow-y-auto bg-[#0a0c14]/60 px-3 py-3"
                >
                  {showOnboarding ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 py-8 text-center"
                    >
                      <OnboardingWave />
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-xs text-sm text-flow-secondary"
                      >
                        I&apos;m Pulse AI — your campaign copilot.
                      </motion.p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                          <motion.button
                            key={action}
                            type="button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.12 }}
                            onClick={() => void sendUserMessage(action)}
                            className="ai-chip-solid rounded-full px-3 py-1.5 text-xs text-cyan-100/90 hover:border-cyan-400/40"
                          >
                            {action}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 py-10 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-flow-glass-faint bg-flow-glass-subtle">
                        <Sparkles className="h-6 w-6 text-violet-300/80" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-flow">How can I help?</p>
                        <p className="mt-1 max-w-[260px] text-xs text-flow-muted">
                          Ask anything about copy, subjects, CTAs, or paste email content.
                          Press <kbd className="rounded border border-flow-glass-faint px-1">⌘K</kbd> anytime.
                        </p>
                      </div>
                      <div className="relative z-10 flex max-w-sm flex-wrap justify-center gap-2">
                        {QUICK_ACTIONS.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => void sendUserMessage(action)}
                            className="ai-chip-solid rounded-full px-3 py-1.5 text-xs text-flow-secondary transition-colors hover:border-violet-400/35 hover:text-flow"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        role={m.role}
                        content={m.content}
                        streaming={m.streaming}
                      />
                    ))
                  )}
                  {isTyping ? <TypingIndicator /> : null}
                </div>

                <form
                  onSubmit={onSubmit}
                  className="relative z-10 shrink-0 border-t border-white/10 bg-[#0a0c14]/95 p-3"
                >
                  <CommandPalette />
                  <div className="relative flex items-end gap-2 rounded-2xl border border-white/12 bg-[#12182a] px-3 py-2 focus-within:border-cyan-400/45">
                    <textarea
                      value={input}
                      onChange={(e) => {
                        const v = e.target.value
                        setInput(v)
                        if (v === "/") setCommandOpen(true)
                        else if (!v.startsWith("/")) setCommandOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          void sendUserMessage(input)
                        }
                      }}
                      rows={2}
                      placeholder="Message Pulse…  type / for commands"
                      className="max-h-28 min-h-[44px] flex-1 resize-none bg-transparent text-sm text-flow outline-none placeholder:text-flow-faint"
                    />
                    <Button
                      type="submit"
                      size="icon-sm"
                      disabled={!input.trim()}
                      className="shrink-0 bg-gradient-to-r from-cyan-600 to-violet-600 text-white"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {commandOpen ? (
                    <p className="mt-1.5 text-[10px] text-flow-faint">↑↓ commands · Esc to close</p>
                  ) : null}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

/* ─── Keyboard + lifecycle ─── */

function useAiKeyboardShortcuts() {
  const toggle = useAiAssistantStore((s) => s.toggleOpen)
  const setOpen = useAiAssistantStore((s) => s.setOpen)
  const setCommand = useAiAssistantStore((s) => s.setCommandPaletteOpen)
  const isOpen = useAiAssistantStore((s) => s.isOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault()
        toggle()
      }
      if (e.key === "Escape") {
        setCommand(false)
        if (isOpen) setOpen(false)
      }
      if (e.key === "/" && !isOpen && !(e.target instanceof HTMLInputElement)) {
        const t = e.target as HTMLElement
        if (t.tagName === "TEXTAREA" || t.isContentEditable) return
        e.preventDefault()
        setOpen(true)
        setCommand(true)
        useAiAssistantStore.getState().setInputValue("/")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle, setOpen, setCommand, isOpen])
}

function useWelcomeBubbleTimer() {
  const trigger = useAiAssistantStore((s) => s.triggerWelcomeBubble)
  const dismissed = useAiAssistantStore((s) => s.welcomeBubbleDismissed)

  useEffect(() => {
    if (dismissed) return
    const t = setTimeout(trigger, 1500)
    return () => clearTimeout(t)
  }, [trigger, dismissed])
}

/* ─── Email context bridge (templates) ─── */

export function AiEmailContextBridge({
  subject = "",
  body = "",
}: {
  subject?: string
  body?: string
}) {
  const setEmailContext = useAiAssistantStore((s) => s.setEmailContext)
  const addHint = useAiAssistantStore((s) => s.addProactiveHint)
  const isOpen = useAiAssistantStore((s) => s.isOpen)

  useEffect(() => {
    setEmailContext({ subject, body })
  }, [subject, body, setEmailContext])

  useEffect(() => {
    const onSelect = () => {
      const sel = window.getSelection()?.toString().trim()
      if (sel) useAiAssistantStore.getState().setSelectedText(sel)
    }
    document.addEventListener("selectionchange", onSelect)
    return () => document.removeEventListener("selectionchange", onSelect)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const hints: { msg: string; severity: "info" | "warning" | "tip" }[] = []
    if (subject.length > 60)
      hints.push({ msg: "Your subject line may reduce open rate", severity: "warning" })
    if (subject.length > 0 && subject.length < 12)
      hints.push({ msg: "Subject line feels short — add intrigue", severity: "tip" })
    if (body.length > 1200)
      hints.push({ msg: "This paragraph is too long", severity: "warning" })
    const ctaWeak = /\b(click here|learn more)\b/i.test(body)
    if (ctaWeak) hints.push({ msg: "This CTA could be stronger", severity: "info" })
    const t = setTimeout(() => {
      hints.forEach((h) => addHint({ message: h.msg, severity: h.severity }))
    }, 800)
    return () => clearTimeout(t)
  }, [subject, body, isOpen, addHint])

  return null
}

/* ─── Public API ─── */

/** Floating Pulse AI copilot — mount once in app shell */
export function AiAssistant() {
  const isOpen = useAiAssistantStore((s) => s.isOpen)
  const setOpen = useAiAssistantStore((s) => s.setOpen)
  const toggle = useAiAssistantStore((s) => s.toggleOpen)

  useAiKeyboardShortcuts()
  useWelcomeBubbleTimer()

  return (
    <>
      <AnimatePresence>
        {!isOpen ? (
          <motion.div
            key="fab"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={SPRING}
          >
            <FloatingPulseButton onClick={toggle} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AiChatPanel />
      {!isOpen ? (
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-24 right-6 z-[60] hidden items-center gap-1 rounded-full border border-white/15 bg-[#12182a]/95 px-2.5 py-1 text-[10px] text-flow-faint md:flex"
          onClick={() => setOpen(true)}
        >
          <span className="rounded border border-white/15 px-1 font-mono">⌘K</span>
        </motion.button>
      ) : null}
    </>
  )
}

/** @deprecated Use floating AiAssistant in shell; bridge keeps template context */
export function AiAssistantEmbedded(props: {
  compact?: boolean
  subject?: string
  body?: string
}) {
  return <AiEmailContextBridge subject={props.subject} body={props.body} />
}
