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

export async function runAiAssist(input: AiAssistInput) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  const client = new OpenAI({ apiKey })

  const userPrompt = JSON.stringify(input)

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
}
