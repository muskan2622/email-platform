import { NextRequest } from "next/server"

/**
 * Validates the shared secret for machine-to-machine event ingestion.
 * Set EVENTS_API_KEY in env; callers pass `Authorization: Bearer <key>`.
 */
export function assertEventsApiKey(request: NextRequest): boolean {
  const expected = process.env.EVENTS_API_KEY
  if (!expected) return true

  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return false
  return header.slice(7) === expected
}
