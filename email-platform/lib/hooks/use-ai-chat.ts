"use client"

import { useCallback } from "react"
import { buildPlatformContextSummary } from "@/lib/ai/platform-context"
import { apiPost } from "@/lib/api/client"
import type { PlatformStats } from "@/lib/hooks/use-platform-data"
import type { AiTabId } from "@/lib/stores/ai-assistant-store"
import { useAiAssistantStore } from "@/lib/stores/ai-assistant-store"

type AiAction = "draft" | "rewrite_tone" | "subject_lines" | "improve"

function tabToAction(tab: AiTabId, prompt: string): AiAction {
  const lower = prompt.toLowerCase()
  if (lower.startsWith("/subject") || tab === "subject") return "subject_lines"
  if (lower.startsWith("/tone") || tab === "tone") return "rewrite_tone"
  return "improve"
}

function parseSlashCommand(input: string): { action: AiAction; tone?: string } {
  const t = input.trim().toLowerCase()
  if (t.startsWith("/subject")) return { action: "subject_lines" }
  if (t.startsWith("/tone")) return { action: "rewrite_tone", tone: "professional" }
  if (t.startsWith("/shorten") || t.startsWith("/summarize")) return { action: "improve" }
  if (t.startsWith("/cta") || t.startsWith("/improve")) return { action: "improve" }
  if (t.startsWith("/translate")) return { action: "rewrite_tone", tone: "translate" }
  if (t.startsWith("/debug")) return { action: "draft" }
  return { action: "improve" }
}

async function streamText(
  full: string,
  onChunk: (partial: string) => void,
  chunkSize = 3,
  delayMs = 16
) {
  let acc = ""
  for (let i = 0; i < full.length; i += chunkSize) {
    acc = full.slice(0, i + chunkSize)
    onChunk(acc)
    await new Promise((r) => setTimeout(r, delayMs))
  }
  onChunk(full)
}

export function useAiChat(platformData?: PlatformStats | null) {
  const store = useAiAssistantStore()
  const platformContext = buildPlatformContextSummary(platformData ?? null)

  const sendUserMessage = useCallback(
    async (rawInput: string) => {
      const input = rawInput.trim()
      if (!input || store.isStreaming) return

      const { emailContext, activeTab } = store
      const subject = emailContext.subject ?? ""
      const body = emailContext.selectedText ?? emailContext.body ?? ""
      const slash = input.startsWith("/") ? parseSlashCommand(input) : null
      const action = slash?.action ?? tabToAction(activeTab, input)

      store.addMessage("user", input)
      store.setInputValue("")
      store.setCommandPaletteOpen(false)
      store.clearProactiveHints()

      const assistantId = store.addMessage("assistant", "", { streaming: true })
      useAiAssistantStore.setState({ isTyping: true, isStreaming: true })

      try {
        const result = await apiPost<{
          subject: string | null
          body_html: string
          suggestions: string[]
        }>("/api/ai/assist", {
          action,
          subject,
          body,
          tone: slash?.tone,
          context: input.startsWith("/") ? input : `${activeTab}: ${input}`,
          platform_context: platformContext,
        })

        const parts: string[] = []
        if (result.subject) parts.push(`**Subject**\n${result.subject}`)
        const plainBody = result.body_html?.replace(/<[^>]+>/g, " ").trim()
        if (plainBody) parts.push(`**Copy**\n${plainBody}`)
        if (result.suggestions?.length) {
          parts.push(
            `**Suggestions**\n${result.suggestions.map((s) => `• ${s}`).join("\n")}`
          )
        }
        const full = parts.join("\n\n") || "Done — no changes returned."

        useAiAssistantStore.setState({ isTyping: false })
        await streamText(full, (partial) => {
          store.updateMessage(assistantId, partial, true)
        })
        store.removeStreamingFlag(assistantId)

        const applyText = plainBody || result.subject || ""
        if (applyText) {
          store.setPendingApply(applyText)
          if (emailContext.selectedText && plainBody) {
            store.setDiffPreview({
              before: emailContext.selectedText,
              after: plainBody,
              label: "Selection rewrite",
            })
          }
        }
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "AI unavailable — add OPENAI_API_KEY to .env.local"
        useAiAssistantStore.setState({ isTyping: false })
        await streamText(msg, (partial) => {
          store.updateMessage(assistantId, partial, true)
        })
        store.removeStreamingFlag(assistantId)
      }
    },
    [store, platformContext]
  )

  return { sendUserMessage }
}
