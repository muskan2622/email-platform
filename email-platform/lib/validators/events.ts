import type { IncomingEvent } from "@/lib/types/database"

export function parseIncomingEvent(body: unknown): IncomingEvent | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  if (typeof b.type !== "string" || !b.type.trim()) return null

  const event: IncomingEvent = {
    type: b.type.trim(),
    payload:
      b.payload && typeof b.payload === "object"
        ? (b.payload as Record<string, unknown>)
        : {},
  }

  if (b.user && typeof b.user === "object") {
    const u = b.user as Record<string, unknown>
    if (typeof u.external_id === "string" && typeof u.email === "string") {
      event.user = {
        external_id: u.external_id,
        email: u.email,
        metadata:
          u.metadata && typeof u.metadata === "object"
            ? (u.metadata as Record<string, unknown>)
            : undefined,
        unsubscribed_product:
          typeof u.unsubscribed_product === "boolean"
            ? u.unsubscribed_product
            : undefined,
      }
    }
  }

  return event
}
