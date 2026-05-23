import type { AiTabId } from "@/lib/stores/ai-assistant-store"

export type AssistIntent =
  | "greeting"
  | "product_overview"
  | "last_send_recipient"
  | "last_send"
  | "send_failures"
  | "triggers"
  | "templates"
  | "automations"
  | "events"
  | "metrics"
  | "general_status"

const COPY_TABS: AiTabId[] = ["copy", "subject", "tone", "cta", "translate"]

const COPY_KEYWORDS =
  /\b(rewrite|re-?write|improve|polish|shorten|condense|subject line|subject lines|make (it |this )?(more |)(urgent|friendly|professional|casual)|tone|cta|call to action|translate|draft|generate\s+\d*\s*subject|friendlier|shorter)\b/i

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, " ")
}

export function isEmailCopyRequest(
  input: string,
  hasEmailBody: boolean,
  activeTab: AiTabId
): boolean {
  const q = normalize(input)
  if (COPY_KEYWORDS.test(q)) return true
  if (COPY_TABS.includes(activeTab) && hasEmailBody && q.length < 120) {
    if (classifyAssistIntent(input)) return false
    return true
  }
  return false
}

export function isGeneralQuestion(input: string): boolean {
  const q = normalize(input)
  if (q.endsWith("?")) return true
  return (
    /^(what|who|when|where|why|how|tell|show|list|which|can you|could you|do you|is there|are there|explain|describe)\b/.test(
      q
    ) ||
    /\b(kya|kaun|kab|kahan|kitne|batao|bata|dikhao|samjha|samjhao|kisko|kis ko)\b/.test(q)
  )
}

export function classifyAssistIntent(input: string): AssistIntent | null {
  const q = normalize(input)

  if (/^(hi|hello|hey|namaste|hola)\b/.test(q) && q.length < 40) return "greeting"

  if (
    /\b(what is (this|the software|pulsemail|pulse)|software (is )?about|platform about|app (is )?about|kya hai|ye kya hai|yeh kya hai|what does (this|it|pulsemail) do|how does (this|it|pulsemail) work|features|capabilities|help me understand)\b/.test(
      q
    ) ||
    /\b(about (the |this )?(software|platform|app|product))\b/.test(q)
  ) {
    return "product_overview"
  }

  if (
    /\b(last|latest|recent|aakhri|sabse last|most recent)\b.*\b(mail|email|message|send)\b/.test(
      q
    ) &&
    /\b(kisko|kis ko|recipient|sent to|who got|who received|whom|to whom|kahan gaya|gaya tha|gayi thi)\b/.test(
      q
    )
  ) {
    return "last_send_recipient"
  }

  if (
    /\b(last|latest|recent|aakhri|sabse last)\b.*\b(mail|email|message|send)\b/.test(q) ||
    /\b(last sent|last email sent|most recent send)\b/.test(q)
  ) {
    return "last_send"
  }

  if (
    /\b(fail|failed|failure|error|bounce|why.*fail|kyon fail|kyn fail)\b/.test(q) &&
    /\b(mail|email|send|sent)\b/.test(q)
  ) {
    return "send_failures"
  }

  if (/\b(trigger|triggers|rule|rules|workflow)\b/.test(q) && !COPY_KEYWORDS.test(q)) {
    return "triggers"
  }

  if (/\b(template|templates)\b/.test(q) && !COPY_KEYWORDS.test(q)) {
    return "templates"
  }

  if (/\b(automation|automations)\b/.test(q)) {
    return "automations"
  }

  if (/\b(event|events)\b/.test(q) && !COPY_KEYWORDS.test(q)) {
    return "events"
  }

  if (
    /\b(how many|sent today|kitne bhej|aaj kitne|metrics|stats|statistics|dashboard|report)\b/.test(
      q
    )
  ) {
    return "metrics"
  }

  if (
    /\b(status|what'?s up|whats up|how are things|current|overview|summarize)\b/.test(q) &&
    /\b(platform|campaign|dashboard|data|account|system)\b/.test(q)
  ) {
    return "general_status"
  }

  if (
    /\b(status|what'?s up|whats up|how are things|current|overview|dashboard|metrics|report)\b/.test(
      q
    ) ||
    /\b(how many|sent today|failed|triggers|events)\b/.test(q)
  ) {
    return "general_status"
  }

  if (isGeneralQuestion(input) && /\b(mail|email|send|sent|recipient|trigger|template)\b/.test(q)) {
    return "general_status"
  }

  return null
}

export function isPlatformSummarizeQuery(input: string, hasEmailBody: boolean): boolean {
  const q = normalize(input)
  if (hasEmailBody && q.length < 80) return false
  return /\b(summarize|summary)\b/.test(q) && /\b(platform|campaign|dashboard|data|status)\b/.test(q)
}

export function shouldUseLocalAssist(
  input: string,
  hasEmailBody: boolean,
  activeTab: AiTabId
): boolean {
  if (input.trim().startsWith("/")) return false
  if (classifyAssistIntent(input)) return true
  if (isPlatformSummarizeQuery(input, hasEmailBody)) return true
  if (input.trim().toLowerCase() === "summarize" && !hasEmailBody) return true
  if (activeTab === "summarize" && !hasEmailBody) return true
  if (isGeneralQuestion(input) && !isEmailCopyRequest(input, hasEmailBody, activeTab)) {
    return true
  }
  return false
}
