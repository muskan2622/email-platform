import type { PlatformStats } from "@/lib/hooks/use-platform-data"
import { formatRelativeTime } from "@/lib/utils/time"

export function isDataQuery(input: string): boolean {
  const q = input.toLowerCase().trim()
  if (q.startsWith("/")) return false
  return (
    /\b(status|what'?s up|whats up|how are things|current|overview|dashboard|metrics|report)\b/.test(
      q
    ) ||
    /\b(how many|sent today|failed|triggers|events)\b/.test(q) ||
    /^(hi|hello|hey)\b/.test(q)
  )
}

export function isPlatformSummarizeQuery(input: string, hasEmailBody: boolean): boolean {
  const q = input.toLowerCase().trim()
  if (hasEmailBody && q.length < 80) return false
  return /\b(summarize|summary)\b/.test(q) && /\b(platform|campaign|dashboard|data|status)\b/.test(q)
}

export function buildLocalDataResponse(
  input: string,
  data: PlatformStats | null
): { body_html: string; suggestions: string[] } | null {
  if (!data) {
    return {
      body_html:
        "**Platform data unavailable**\n\nConnect Supabase in `.env.local`:\n- `NEXT_PUBLIC_SUPABASE_URL`\n- `SUPABASE_SERVICE_ROLE_KEY`\n\nThen restart `npm run dev`.",
      suggestions: ["Check .env.local", "Run supabase db push"],
    }
  }

  const recentSends = data.sendLog.slice(0, 4)
  const recentEvents = data.events.slice(0, 3)

  const lines = [
    "## Campaign status (live from Supabase)",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Sent today | **${data.sentToday}** |`,
    `| Total sent (loaded) | ${data.sentCount} |`,
    `| Failed | ${data.failedCount} |`,
    `| Skipped | ${data.skippedCount} |`,
    `| Events | ${data.eventsCount} |`,
    `| Active triggers | ${data.activeTriggers} |`,
    `| Templates | ${data.templates.length} |`,
    "",
  ]

  if (recentSends.length) {
    lines.push("### Recent sends")
    for (const s of recentSends) {
      lines.push(
        `- **${s.status}** · ${s.triggers?.name ?? "Send"} → ${s.end_users?.email ?? "—"} · ${formatRelativeTime(s.created_at)}`
      )
    }
    lines.push("")
  }

  if (recentEvents.length) {
    lines.push("### Recent events")
    for (const e of recentEvents) {
      lines.push(`- \`${e.type}\` · ${formatRelativeTime(e.created_at)}`)
    }
    lines.push("")
  }

  const q = input.toLowerCase()
  if (/^(hi|hello|hey)\b/.test(q)) {
    lines.unshift(
      "Hey — I'm Pulse AI. Your Supabase data is connected.",
      ""
    )
  }

  lines.push(
    "_Copy questions use OpenAI — add billing/credits if you see quota errors._"
  )

  return {
    body_html: lines.join("\n"),
    suggestions: [
      "Generate 10 subject lines",
      "Improve conversions",
      data.failedCount > 0 ? "Why did sends fail?" : "Show trigger breakdown",
    ],
  }
}
