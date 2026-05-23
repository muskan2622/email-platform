import { create } from "zustand"
import { persist } from "zustand/middleware"

export type AiTabId =
  | "copy"
  | "subject"
  | "tone"
  | "campaign"
  | "debug"
  | "cta"
  | "translate"
  | "summarize"

export type ChatRole = "user" | "assistant" | "system"

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  streaming?: boolean
  createdAt: number
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: number
}

export interface ProactiveHint {
  id: string
  message: string
  severity: "info" | "warning" | "tip"
}

export interface DiffPreview {
  before: string
  after: string
  label?: string
}

export interface EmailContext {
  subject?: string
  body?: string
  selectedText?: string
}

const TAB_LABELS: Record<AiTabId, string> = {
  copy: "Copy Writer",
  subject: "Subject Generator",
  tone: "Tone Rewriter",
  campaign: "Campaign Ideas",
  debug: "Debug Email",
  cta: "Improve CTA",
  translate: "Translate",
  summarize: "Summarize",
}

export function getTabLabel(id: AiTabId) {
  return TAB_LABELS[id]
}

export const AI_TABS: AiTabId[] = [
  "copy",
  "subject",
  "tone",
  "campaign",
  "debug",
  "cta",
  "translate",
  "summarize",
]

export const QUICK_ACTIONS = [
  "Who got the last email?",
  "What is this software about?",
  "Campaign status overview",
  "Rewrite this professionally",
  "Generate 10 subject lines",
  "Any failed sends?",
] as const

export const SLASH_COMMANDS = [
  { cmd: "/improve", desc: "Polish copy for clarity and impact" },
  { cmd: "/subject", desc: "Generate subject line variants" },
  { cmd: "/tone", desc: "Rewrite tone (friendly, urgent, formal)" },
  { cmd: "/shorten", desc: "Condense without losing meaning" },
  { cmd: "/cta", desc: "Strengthen call-to-action" },
  { cmd: "/translate", desc: "Translate to another language" },
  { cmd: "/summarize", desc: "Summarize key points" },
  { cmd: "/debug", desc: "Diagnose deliverability & structure" },
] as const

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultConversation(): Conversation {
  return {
    id: uid(),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now(),
  }
}

interface AiAssistantState {
  isOpen: boolean
  isFullscreen: boolean
  panelWidth: number
  panelHeight: number
  activeTab: AiTabId
  activeConversationId: string
  conversations: Conversation[]
  isTyping: boolean
  isStreaming: boolean
  commandPaletteOpen: boolean
  inputValue: string
  hasCompletedOnboarding: boolean
  showWelcomeBubble: boolean
  welcomeBubbleDismissed: boolean
  emailContext: EmailContext
  proactiveHints: ProactiveHint[]
  diffPreview: DiffPreview | null
  pendingApply: string | null
  historySidebarOpen: boolean

  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setFullscreen: (v: boolean) => void
  setPanelSize: (w: number, h: number) => void
  setActiveTab: (tab: AiTabId) => void
  setInputValue: (v: string) => void
  setCommandPaletteOpen: (v: boolean) => void
  setHistorySidebarOpen: (v: boolean) => void
  setEmailContext: (ctx: Partial<EmailContext>) => void
  setSelectedText: (text: string | undefined) => void
  setDiffPreview: (diff: DiffPreview | null) => void
  setPendingApply: (text: string | null) => void
  dismissWelcomeBubble: () => void
  triggerWelcomeBubble: () => void
  completeOnboarding: () => void
  addProactiveHint: (hint: Omit<ProactiveHint, "id">) => void
  clearProactiveHints: () => void

  getActiveConversation: () => Conversation
  createConversation: () => void
  selectConversation: (id: string) => void
  addMessage: (role: ChatRole, content: string, opts?: { streaming?: boolean }) => string
  updateMessage: (messageId: string, content: string, streaming?: boolean) => void
  removeStreamingFlag: (messageId: string) => void
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set, get) => {
      const initial = defaultConversation()
      return {
        isOpen: false,
        isFullscreen: false,
        panelWidth: 440,
        panelHeight: 620,
        activeTab: "copy",
        activeConversationId: initial.id,
        conversations: [initial],
        isTyping: false,
        isStreaming: false,
        commandPaletteOpen: false,
        inputValue: "",
        hasCompletedOnboarding: false,
        showWelcomeBubble: false,
        welcomeBubbleDismissed: false,
        emailContext: {},
        proactiveHints: [],
        diffPreview: null,
        pendingApply: null,
        historySidebarOpen: true,

        setOpen: (open) => set({ isOpen: open }),
        toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
        setFullscreen: (v) => set({ isFullscreen: v }),
        setPanelSize: (w, h) =>
          set({
            panelWidth: Math.min(920, Math.max(360, w)),
            panelHeight: Math.min(900, Math.max(480, h)),
          }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setInputValue: (v) => set({ inputValue: v }),
        setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
        setHistorySidebarOpen: (v) => set({ historySidebarOpen: v }),
        setEmailContext: (ctx) =>
          set((s) => ({ emailContext: { ...s.emailContext, ...ctx } })),
        setSelectedText: (text) =>
          set((s) => ({
            emailContext: { ...s.emailContext, selectedText: text },
          })),
        setDiffPreview: (diff) => set({ diffPreview: diff }),
        setPendingApply: (text) => set({ pendingApply: text }),
        dismissWelcomeBubble: () =>
          set({ showWelcomeBubble: false, welcomeBubbleDismissed: true }),
        triggerWelcomeBubble: () => {
          const { welcomeBubbleDismissed } = get()
          if (!welcomeBubbleDismissed) set({ showWelcomeBubble: true })
        },
        completeOnboarding: () => set({ hasCompletedOnboarding: true }),
        addProactiveHint: (hint) =>
          set((s) => ({
            proactiveHints: [
              ...s.proactiveHints.filter((h) => h.message !== hint.message),
              { ...hint, id: uid() },
            ].slice(-4),
          })),
        clearProactiveHints: () => set({ proactiveHints: [] }),

        getActiveConversation: () => {
          const { conversations, activeConversationId } = get()
          return (
            conversations.find((c) => c.id === activeConversationId) ??
            conversations[0]!
          )
        },

        createConversation: () => {
          const conv = defaultConversation()
          set((s) => ({
            conversations: [conv, ...s.conversations],
            activeConversationId: conv.id,
          }))
        },

        selectConversation: (id) => set({ activeConversationId: id }),

        addMessage: (role, content, opts) => {
          const messageId = uid()
          const msg: ChatMessage = {
            id: messageId,
            role,
            content,
            streaming: opts?.streaming,
            createdAt: Date.now(),
          }
          set((s) => {
            const conversations = s.conversations.map((c) => {
              if (c.id !== s.activeConversationId) return c
              const title =
                c.messages.length === 0 && role === "user"
                  ? content.slice(0, 42) + (content.length > 42 ? "…" : "")
                  : c.title
              return {
                ...c,
                title,
                messages: [...c.messages, msg],
                updatedAt: Date.now(),
              }
            })
            return { conversations }
          })
          return messageId
        },

        updateMessage: (messageId, content, streaming) =>
          set((s) => ({
            conversations: s.conversations.map((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content, streaming: streaming ?? m.streaming }
                  : m
              ),
              updatedAt: c.id === s.activeConversationId ? Date.now() : c.updatedAt,
            })),
          })),

        removeStreamingFlag: (messageId) =>
          set((s) => ({
            conversations: s.conversations.map((c) => ({
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, streaming: false } : m
              ),
            })),
            isStreaming: false,
          })),
      }
    },
    {
      name: "pulse-ai-assistant",
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        welcomeBubbleDismissed: s.welcomeBubbleDismissed,
        conversations: s.conversations.slice(0, 12),
        activeConversationId: s.activeConversationId,
        panelWidth: s.panelWidth,
        panelHeight: s.panelHeight,
        historySidebarOpen: s.historySidebarOpen,
      }),
    }
  )
)
