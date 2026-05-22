import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { fetchPlatformSnapshot } from "@/lib/platform/queries"
import { createAdminClient } from "@/lib/supabase/admin"

/** Single bootstrap request for dashboard data (replaces 4 parallel API calls). */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const eventsLimit = Number(request.nextUrl.searchParams.get("events_limit") ?? "50")
    const sendLogLimit = Number(request.nextUrl.searchParams.get("send_log_limit") ?? "100")

    const snapshot = await fetchPlatformSnapshot(supabase, {
      eventsLimit,
      sendLogLimit,
    })

    return jsonOk(snapshot)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load platform data"
    return jsonError(message, 500)
  }
}
