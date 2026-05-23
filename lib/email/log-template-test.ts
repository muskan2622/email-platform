import { createAdminClient } from "@/lib/supabase/admin"
import type { ProcessingResult, SendLogStatus } from "@/lib/types/database"

export type LogTemplateTestInput = {
  templateId: string
  to: string
  provider: string
  renderedSubject: string
  providerMessageId?: string
  status: SendLogStatus
  error?: string
}

/**
 * Records a manual template test in events + send_log so Events and Email Logs stay in sync.
 */
export async function logTemplateTestSend(input: LogTemplateTestInput): Promise<{
  event_id: string
  send_log_id: string
}> {
  const supabase = createAdminClient()
  const externalId = `test:${input.to.toLowerCase()}`

  const { data: endUser, error: userError } = await supabase
    .from("end_users")
    .upsert(
      {
        external_id: externalId,
        email: input.to,
        metadata: { source: "template_test" },
      },
      { onConflict: "external_id" }
    )
    .select("id")
    .single()

  if (userError) throw new Error(`end_users upsert: ${userError.message}`)

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .insert({
      type: "template.test_send",
      payload: {
        template_id: input.templateId,
        to: input.to,
        provider: input.provider,
        source: "template_studio",
      },
      user_external_id: externalId,
      processed_at: new Date().toISOString(),
      processing_result: {
        matched_triggers: 0,
        evaluations: [
          {
            trigger_id: "",
            trigger_name: "Template test",
            template_id: input.templateId,
            status: input.status,
            provider_message_id: input.providerMessageId,
            error: input.error,
          },
        ],
      } satisfies ProcessingResult,
    })
    .select("id")
    .single()

  if (eventError) throw new Error(`events insert: ${eventError.message}`)

  const eventId = eventRow.id as string

  const { data: logRow, error: logError } = await supabase
    .from("send_log")
    .insert({
      event_id: eventId,
      template_id: input.templateId,
      end_user_id: endUser.id,
      status: input.status,
      provider_message_id: input.providerMessageId ?? null,
      rendered_subject: input.renderedSubject,
      error: input.error ?? null,
      skip_reason: input.status === "skipped" ? "manual_test" : null,
    })
    .select("id")
    .single()

  if (logError) throw new Error(`send_log insert: ${logError.message}`)

  return { event_id: eventId, send_log_id: logRow.id as string }
}
