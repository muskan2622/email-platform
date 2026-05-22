import OpenAI from "openai"

export type AiAssistAction =
  | "draft"
  | "rewrite_tone"
  | "subject_lines"
  | "improve"

export interface AiAssistInput {
  action: AiAssistAction
  subject?: string
  body?: string
  tone?: string
  context?: string
  platform_context?: string
}

const SYSTEM = `You are Pulse AI, an email campaign copilot for non-technical marketers.
You may receive live platform metrics (sends, events, triggers, templates) — use them when relevant.
Return concise, professional copy. Use {{placeholder}} syntax for dynamic fields when appropriate.
Respond in JSON: { "subject": string | null, "body_html": string, "suggestions": string[] }`

function formatOpenAiError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { status?: number; message?: string; error?: { message?: string } }
    const msg = e.error?.message ?? e.message ?? "OpenAI request failed"
    if (e.status === 429 || msg.includes("quota")) {
      return `${msg}\n\n**Fix:** Add credits at https://platform.openai.com/account/billing — or ask status/metrics questions (those work without OpenAI).`
    }
    if (e.status === 401) {
      return "Invalid OPENAI_API_KEY — check .env.local and restart the dev server."
    }
    return msg
  }
  return err instanceof Error ? err.message : "OpenAI request failed"
}

export async function runAiAssist(input: AiAssistInput) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to .env.local for copy writing — status questions work from Supabase without it."
    )
  }

  const client = new OpenAI({ apiKey })
  const userPrompt = JSON.stringify(input)

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error("Empty AI response")

    return JSON.parse(raw) as {
      subject: string | null
      body_html: string
      suggestions: string[]
    }
  } catch (err) {
    throw new Error(formatOpenAiError(err))
  }
}
