"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { GlassCard } from "@/components/motion/glass-card"
import { Sparkles } from "lucide-react"
import { usePlatformDataContext } from "@/components/providers/platform-data-provider"
import { apiPost } from "@/lib/api/client"

export function AiAssistant({
  compact = false,
  subject = "",
  body = "",
}: {
  compact?: boolean
  subject?: string
  body?: string
}) {
  const { data } = usePlatformDataContext()
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)

  const statsText = data
    ? `${data.sentCount} emails sent · ${data.eventsCount} events · ${data.templates.length} templates. Use AI enhance when OPENAI_API_KEY is set.`
    : "Loading platform stats…"

  async function runAssist(action: "improve" | "subject_lines") {
    setLoading(true)
    try {
      const result = await apiPost<{
        subject: string | null
        body_html: string
        suggestions: string[]
      }>("/api/ai/assist", { action, subject, body })
      const parts = [
        result.subject ? `Subject: ${result.subject}` : "",
        result.body_html?.replace(/<[^>]+>/g, " ").trim(),
        result.suggestions?.length
          ? `Suggestions: ${result.suggestions.join("; ")}`
          : "",
      ].filter(Boolean)
      setText(parts.join("\n\n"))
    } catch (e) {
      setText(
        e instanceof Error ? e.message : "AI unavailable — add OPENAI_API_KEY to .env.local"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard glow className={compact ? "p-4" : "p-5 md:p-6"}>
      <div className="flex items-start gap-4">
        <motion.div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-violet-300" />
          </div>
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-300/80">
            Pulse AI
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {text || statsText}
          </p>
          {!compact && (
            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                type="button"
                disabled={loading}
                onClick={() => runAssist("improve")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 transition-colors hover:border-violet-500/40 disabled:opacity-50"
              >
                {loading ? "Thinking…" : "Improve copy"}
              </motion.button>
              <motion.button
                type="button"
                disabled={loading}
                onClick={() => runAssist("subject_lines")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 transition-colors hover:border-violet-500/40 disabled:opacity-50"
              >
                Subject ideas
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
