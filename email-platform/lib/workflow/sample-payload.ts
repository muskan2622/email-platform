import type { EventTypeRow } from "@/lib/platform/types"
import type { IncomingEvent } from "@/lib/types/database"

export function buildSamplePayload(
  eventType: string,
  catalogEntry?: Pick<EventTypeRow, "sample_payload"> | null
): IncomingEvent {
  const sample = catalogEntry?.sample_payload
  if (sample && typeof sample === "object" && !Array.isArray(sample)) {
    const base = sample as Record<string, unknown>
    return {
      type: typeof base.type === "string" ? base.type : eventType,
      message_id:
        typeof base.message_id === "string"
          ? base.message_id
          : `evt_preview_${eventType.replace(/[^a-z0-9]/gi, "_")}`,
      source: typeof base.source === "string" ? base.source : "workflow-simulator",
      timestamp:
        typeof base.timestamp === "string" ? base.timestamp : new Date().toISOString(),
      identifiers:
        base.identifiers && typeof base.identifiers === "object"
          ? (base.identifiers as Record<string, unknown>)
          : { workspace_id: "ws_preview" },
      user:
        base.user && typeof base.user === "object"
          ? normalizeUser(base.user as Record<string, unknown>)
          : {
              external_id: "user_preview",
              email: "preview@example.com",
              metadata: { plan_name: "pro", timezone: "UTC" },
              unsubscribed_product: false,
            },
      payload:
        base.payload && typeof base.payload === "object"
          ? (base.payload as Record<string, unknown>)
          : { plan_name: "pro" },
    }
  }

  return {
    type: eventType,
    message_id: `evt_preview_${eventType.replace(/[^a-z0-9]/gi, "_")}`,
    source: "workflow-simulator",
    timestamp: new Date().toISOString(),
    identifiers: { workspace_id: "ws_preview" },
    user: {
      external_id: "user_preview",
      email: "preview@example.com",
      metadata: { plan_name: "pro", timezone: "UTC" },
      unsubscribed_product: false,
    },
    payload: { plan_name: "pro" },
  }
}

function normalizeUser(u: Record<string, unknown>) {
  return {
    external_id: typeof u.external_id === "string" ? u.external_id : "user_preview",
    email: typeof u.email === "string" ? u.email : "preview@example.com",
    metadata:
      u.metadata && typeof u.metadata === "object"
        ? (u.metadata as Record<string, unknown>)
        : {},
    unsubscribed_product:
      typeof u.unsubscribed_product === "boolean" ? u.unsubscribed_product : false,
  }
}

export function validatePayloadJson(text: string): { ok: true; value: IncomingEvent } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: "Invalid JSON" }
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Payload must be a JSON object" }
  }
  const obj = parsed as Record<string, unknown>
  if (typeof obj.type !== "string" || !obj.type.trim()) {
    return { ok: false, error: 'Payload must include a "type" string' }
  }
  return {
    ok: true,
    value: {
      type: obj.type.trim(),
      message_id: typeof obj.message_id === "string" ? obj.message_id : undefined,
      source: typeof obj.source === "string" ? obj.source : "workflow-simulator",
      timestamp: typeof obj.timestamp === "string" ? obj.timestamp : new Date().toISOString(),
      identifiers:
        obj.identifiers && typeof obj.identifiers === "object"
          ? (obj.identifiers as Record<string, unknown>)
          : undefined,
      user:
        obj.user && typeof obj.user === "object"
          ? normalizeUser(obj.user as Record<string, unknown>)
          : undefined,
      payload:
        obj.payload && typeof obj.payload === "object"
          ? (obj.payload as Record<string, unknown>)
          : {},
    },
  }
}
