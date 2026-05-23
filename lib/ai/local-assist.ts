import { buildProductOverviewMarkdown } from "@/lib/ai/product-knowledge"
import {
  classifyAssistIntent,
  shouldUseLocalAssist,
  type AssistIntent,
} from "@/lib/ai/query-intent"
import type { PlatformStats, SendLogRow } from "@/lib/hooks/use-platform-data"
import { formatRelativeTime } from "@/lib/utils/time"

export {
  classifyAssistIntent,
  isPlatformSummarizeQuery,
  shouldUseLocalAssist,
} from "@/lib/ai/query-intent"

/** @deprecated Use shouldUseLocalAssist */
export function isDataQuery(input: string): boolean {
  return shouldUseLocalAssist(input, false, "copy")
}

function latestSend(data: PlatformStats): SendLogRow | undefined {
  return data.sendLog[0]
}

function formatSendLine(s: SendLogRow): string {
  const who = s.end_users?.email ?? "unknown recipient"
  const trigger = s.triggers?.name ?? "—"
  const template = s.templates?.name ?? "—"
  const subject = s.rendered_subject?.trim() || "(no subject)"
  const when = formatRelativeTime(s.created_at)
  return `- **${s.status}** · **${who}** · “${subject}” · ${trigger} · ${template} · ${when}`
}

function buildSuggestions(data: PlatformStats, intent: AssistIntent | null): string[] {
  const last = latestSend(data)
  const base = ["What is Pulsemail?", "Campaign status overview"]
  if (intent === "product_overview") {
    return ["Who got the last email?", "How many sent today?", "Show active triggers"]
  }
  if (intent === "last_send_recipient" || intent === "last_send") {
    return ["Show recent sends", "Any failed emails?", "How many sent today?"]
  }
  if (data.failedCount > 0) {
    return ["Why did sends fail?", ...base]
  }
  if (last) {
    return [`Last email subject?`, "Show active triggers", ...base]
  }
  return ["Generate 10 subject lines", "Show active triggers", ...base]
}

function answerGreeting(data: PlatformStats): string {
  return [
    "Hey — I'm **Pulse AI**, your Pulsemail copilot.",
    "",
    `Your Supabase data is connected. **${data.sentToday}** emails sent today, **${data.activeTriggers}** active triggers.`,
    "",
    "Ask me who got the last email, what Pulsemail does, or paste email copy to improve.",
  ].join("\n")
}

function answerLastRecipient(data: PlatformStats): string {
  const last = latestSend(data)
  if (!last) {
    return [
      "## Last email recipient",
      "",
      "No sends in the log yet. Once an automation or trigger fires, the recipient will show here.",
    ].join("\n")
  }
  const email = last.end_users?.email ?? "unknown"
  const ext = last.end_users?.external_id
  const lines = [
    "## Last email — who received it?",
    "",
    `The most recent send went to **${email}**`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Status | **${last.status}** |`,
    `| Subject | ${last.rendered_subject?.trim() || "—"} |`,
    `| Trigger | ${last.triggers?.name ?? "—"} |`,
    `| Template | ${last.templates?.name ?? "—"} |`,
    `| When | ${formatRelativeTime(last.created_at)} |`,
  ]
  if (ext) lines.push(`| User ID | \`${ext}\` |`)
  if (last.status === "failed" && last.error) {
    lines.push("", `**Error:** ${last.error}`)
  }
  if (last.status === "skipped" && last.skip_reason) {
    lines.push("", `**Skipped:** ${last.skip_reason}`)
  }
  return lines.join("\n")
}

function answerLastSend(data: PlatformStats): string {
  const last = latestSend(data)
  if (!last) {
    return "## Last email\n\nNo sends recorded yet."
  }
  return ["## Last email sent", "", formatSendLine(last)].join("\n")
}

function answerFailures(data: PlatformStats): string {
  const failed = data.sendLog.filter((s) => s.status === "failed").slice(0, 8)
  if (!failed.length) {
    return [
      "## Failed sends",
      "",
      `No failed sends in the loaded log (**${data.failedCount}** failed in summary). You're clear.`,
    ].join("\n")
  }
  const lines = [
    `## Failed sends (${data.failedCount} total in loaded log)`,
    "",
    ...failed.map((s) => {
      const who = s.end_users?.email ?? "—"
      const err = s.error?.trim() || "No error message stored"
      return `- **${who}** · ${formatRelativeTime(s.created_at)}\n  - ${err}`
    }),
  ]
  return lines.join("\n")
}

function answerTriggers(data: PlatformStats): string {
  const active = data.triggers.filter((t) => t.enabled)
  const lines = [
    `## Triggers (${active.length} active / ${data.triggers.length} total)`,
    "",
  ]
  if (!active.length) {
    lines.push("No active triggers. Enable one under **Rules** or create an automation.")
  } else {
    for (const t of active.slice(0, 12)) {
      lines.push(
        `- **${t.name}** · event \`${t.event_type}\` · template: ${t.templates?.name ?? "—"}`
      )
    }
  }
  return lines.join("\n")
}

function answerTemplates(data: PlatformStats): string {
  const lines = [`## Templates (${data.templates.length})`, ""]
  if (!data.templates.length) {
    lines.push("No templates yet. Create one under **Templates**.")
  } else {
    for (const t of data.templates.slice(0, 10)) {
      lines.push(`- **${t.name}** (${t.status}) · “${t.subject?.slice(0, 60) ?? "—"}”`)
    }
  }
  return lines.join("\n")
}

function answerAutomations(data: PlatformStats): string {
  const lines = [`## Automations (${data.automations.length})`, ""]
  if (!data.automations.length) {
    lines.push("No automations yet. Use **New automation** to build a workflow.")
  } else {
    for (const a of data.automations.slice(0, 10)) {
      lines.push(
        `- **${a.name}** (${a.status}) · \`${a.trigger_event}\` · ${a.templates?.name ?? "no template"}`
      )
    }
  }
  return lines.join("\n")
}

function answerEvents(data: PlatformStats): string {
  const lines = [`## Recent events (${data.eventsCount} loaded)`, ""]
  if (!data.events.length) {
    lines.push("No events yet. Your app can POST events that triggers listen for.")
  } else {
    for (const e of data.events.slice(0, 8)) {
      const done = e.processed_at ? "processed" : "pending"
      lines.push(`- \`${e.type}\` · ${done} · ${formatRelativeTime(e.created_at)}`)
    }
  }
  return lines.join("\n")
}

function answerMetrics(data: PlatformStats): string {
  return [
    "## Metrics (live)",
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Sent today | **${data.sentToday}** |`,
    `| Total sent (loaded log) | ${data.sentCount} |`,
    `| Failed | ${data.failedCount} |`,
    `| Skipped | ${data.skippedCount} |`,
    `| Events (loaded) | ${data.eventsCount} |`,
    `| Active triggers | ${data.activeTriggers} |`,
    `| Templates | ${data.templates.length} |`,
    `| Automations | ${data.automations.length} |`,
  ].join("\n")
}

function answerGeneralStatus(data: PlatformStats, input: string): string {
  const recentSends = data.sendLog.slice(0, 5)
  const recentEvents = data.events.slice(0, 4)
  const last = latestSend(data)

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

  if (last && /\b(last|latest|kisko|who)\b/i.test(input)) {
    lines.push(
      "### Latest send",
      formatSendLine(last),
      ""
    )
  }

  if (recentSends.length) {
    lines.push("### Recent sends")
    for (const s of recentSends) lines.push(formatSendLine(s))
    lines.push("")
  }

  if (recentEvents.length) {
    lines.push("### Recent events")
    for (const e of recentEvents) {
      lines.push(`- \`${e.type}\` · ${formatRelativeTime(e.created_at)}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

function answerByIntent(intent: AssistIntent, data: PlatformStats, input: string): string {
  switch (intent) {
    case "greeting":
      return answerGreeting(data)
    case "product_overview":
      return buildProductOverviewMarkdown()
    case "last_send_recipient":
      return answerLastRecipient(data)
    case "last_send":
      return answerLastSend(data)
    case "send_failures":
      return answerFailures(data)
    case "triggers":
      return answerTriggers(data)
    case "templates":
      return answerTemplates(data)
    case "automations":
      return answerAutomations(data)
    case "events":
      return answerEvents(data)
    case "metrics":
      return answerMetrics(data)
    case "general_status":
      return answerGeneralStatus(data, input)
    default:
      return answerGeneralStatus(data, input)
  }
}

export function buildLocalDataResponse(
  input: string,
  data: PlatformStats | null
): { body_html: string; suggestions: string[] } | null {
  const intent = classifyAssistIntent(input)

  if (!data) {
    if (intent === "product_overview" || intent === "greeting") {
      return {
        body_html: buildProductOverviewMarkdown(),
        suggestions: ["Connect Supabase for live data", "Who got the last email?"],
      }
    }
    return {
      body_html:
        "**Platform data unavailable**\n\nConnect Supabase in `.env.local`:\n- `NEXT_PUBLIC_SUPABASE_URL`\n- `SUPABASE_SERVICE_ROLE_KEY`\n\nThen restart `npm run dev`.\n\n" +
        buildProductOverviewMarkdown(),
      suggestions: ["What is Pulsemail?", "Check .env.local"],
    }
  }

  const resolvedIntent = intent ?? "general_status"
  const body = answerByIntent(resolvedIntent, data, input)

  return {
    body_html: body,
    suggestions: buildSuggestions(data, resolvedIntent),
  }
}
