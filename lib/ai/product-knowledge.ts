/** Static product context for Pulse AI — no API key required. */

export const PRODUCT_NAME = "Pulsemail"

export function buildProductOverviewMarkdown(): string {
  return [
    `## What is ${PRODUCT_NAME}?`,
    "",
    `${PRODUCT_NAME} is an **AI-powered email automation platform** for product and marketing teams. It connects your app events to the right email at the right time — without writing code for every send.`,
    "",
    "### Core capabilities",
    "",
    "- **Templates** — Design and store HTML email templates with dynamic `{{placeholders}}`.",
    "- **Triggers & rules** — Fire emails when events happen (signup, purchase, trial ending, etc.).",
    "- **Automations** — Multi-step workflows: trigger → conditions → template → delivery rules.",
    "- **Event catalog** — Browse and test event types your product can emit.",
    "- **Send log** — See every send: recipient, subject, status (sent / failed / skipped), and errors.",
    "- **Pulse AI** — This assistant: answer questions about your live data, improve copy, subjects, tone, and CTAs.",
    "",
    "### How it works (simple flow)",
    "",
    "1. Your app posts an **event** (e.g. `user.signed_up`) to the platform.",
    "2. A matching **trigger** or **automation** evaluates conditions.",
    "3. The linked **template** is rendered and sent via your email provider.",
    "4. Results appear in the **send log** and dashboard metrics.",
    "",
    "### What you can ask me",
    "",
    "- *Who got the last email?* · *How many sent today?* · *Any failures?*",
    "- *What triggers are active?* · *Summarize my campaign status*",
    "- *Rewrite this email* · *Generate subject lines* (best in the template editor with content selected)",
    "",
    "_Data answers come from your live Supabase connection; copy writing uses OpenAI when configured._",
  ].join("\n")
}
