import { createAdminClient } from "@/lib/supabase/admin"
import { evaluateConditions, parseConditionGroup } from "@/lib/engine/conditions"
import { buildRenderContext, renderEmail } from "@/lib/email/render"
import { sendEmail } from "@/lib/email/send"
import type {
  EndUser,
  IncomingEvent,
  ProcessingResult,
  Template,
  Trigger,
  TriggerEvaluation,
} from "@/lib/types/database"

async function upsertEndUser(
  user: NonNullable<IncomingEvent["user"]>
): Promise<EndUser> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("end_users")
    .upsert(
      {
        external_id: user.external_id,
        email: user.email,
        metadata: user.metadata ?? {},
        unsubscribed_product: user.unsubscribed_product ?? false,
      },
      { onConflict: "external_id" }
    )
    .select()
    .single()

  if (error) throw new Error(`end_users upsert: ${error.message}`)
  return data as EndUser
}

async function hasAlreadySent(
  triggerId: string,
  endUserId: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("send_log")
    .select("id")
    .eq("trigger_id", triggerId)
    .eq("end_user_id", endUserId)
    .eq("status", "sent")
    .maybeSingle()

  return !!data
}

async function logSend(entry: {
  event_id: string
  trigger_id: string
  template_id: string
  end_user_id: string | null
  status: "sent" | "failed" | "skipped"
  skip_reason?: string
  provider_message_id?: string
  rendered_subject?: string
  error?: string
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from("send_log").insert(entry)
  if (error) throw new Error(`send_log insert: ${error.message}`)
}

export async function processEvent(
  incoming: IncomingEvent
): Promise<{ event_id: string; result: ProcessingResult }> {
  const supabase = createAdminClient()

  const userExternalId =
    incoming.user?.external_id ??
    (incoming.payload?.user_id as string | undefined) ??
    (incoming.payload?.external_id as string | undefined) ??
    null

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .insert({
      type: incoming.type,
      payload: incoming.payload ?? {},
      user_external_id: userExternalId,
    })
    .select()
    .single()

  if (eventError) throw new Error(`events insert: ${eventError.message}`)

  const eventId = eventRow.id as string
  const evaluations: TriggerEvaluation[] = []

  let endUser: EndUser | null = null
  if (incoming.user) {
    endUser = await upsertEndUser(incoming.user)
  } else if (userExternalId) {
    const { data } = await supabase
      .from("end_users")
      .select()
      .eq("external_id", userExternalId)
      .maybeSingle()
    endUser = (data as EndUser) ?? null
  }

  const { data: triggers, error: triggerError } = await supabase
    .from("triggers")
    .select("*, templates(*)")
    .eq("event_type", incoming.type)
    .eq("enabled", true)
    .order("priority", { ascending: true })

  if (triggerError) throw new Error(`triggers load: ${triggerError.message}`)

  for (const row of triggers ?? []) {
    const trigger = row as Trigger & { templates: Template }
    const template = trigger.templates
    const conditions = parseConditionGroup(trigger.conditions)

    const passes = evaluateConditions(conditions, {
      payload: incoming.payload ?? {},
      user: endUser,
    })

    if (!passes) {
      evaluations.push({
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        template_id: trigger.template_id,
        status: "skipped",
        skip_reason: "conditions_not_met",
      })
      await logSend({
        event_id: eventId,
        trigger_id: trigger.id,
        template_id: trigger.template_id,
        end_user_id: endUser?.id ?? null,
        status: "skipped",
        skip_reason: "conditions_not_met",
      })
      continue
    }

    if (!endUser?.email) {
      evaluations.push({
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        template_id: trigger.template_id,
        status: "skipped",
        skip_reason: "no_recipient",
      })
      await logSend({
        event_id: eventId,
        trigger_id: trigger.id,
        template_id: trigger.template_id,
        end_user_id: null,
        status: "skipped",
        skip_reason: "no_recipient",
      })
      continue
    }

    if (trigger.send_once_per_user && endUser) {
      const already = await hasAlreadySent(trigger.id, endUser.id)
      if (already) {
        evaluations.push({
          trigger_id: trigger.id,
          trigger_name: trigger.name,
          template_id: trigger.template_id,
          status: "skipped",
          skip_reason: "already_sent_once",
        })
        await logSend({
          event_id: eventId,
          trigger_id: trigger.id,
          template_id: trigger.template_id,
          end_user_id: endUser.id,
          status: "skipped",
          skip_reason: "already_sent_once",
        })
        continue
      }
    }

    if (template.status !== "active") {
      evaluations.push({
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        template_id: trigger.template_id,
        status: "skipped",
        skip_reason: "template_not_active",
      })
      await logSend({
        event_id: eventId,
        trigger_id: trigger.id,
        template_id: trigger.template_id,
        end_user_id: endUser.id,
        status: "skipped",
        skip_reason: "template_not_active",
      })
      continue
    }

    const context = buildRenderContext(incoming.payload ?? {}, endUser)
    const rendered = renderEmail(
      template.subject,
      template.body_html,
      template.body_text,
      context
    )

    try {
      const sent = await sendEmail({
        to: endUser.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      })

      await logSend({
        event_id: eventId,
        trigger_id: trigger.id,
        template_id: trigger.template_id,
        end_user_id: endUser.id,
        status: "sent",
        provider_message_id: sent?.id,
        rendered_subject: rendered.subject,
      })

      evaluations.push({
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        template_id: trigger.template_id,
        status: "sent",
        provider_message_id: sent?.id,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "send_failed"
      await logSend({
        event_id: eventId,
        trigger_id: trigger.id,
        template_id: trigger.template_id,
        end_user_id: endUser.id,
        status: "failed",
        error: message,
        rendered_subject: rendered.subject,
      })
      evaluations.push({
        trigger_id: trigger.id,
        trigger_name: trigger.name,
        template_id: trigger.template_id,
        status: "failed",
        error: message,
      })
    }
  }

  const result: ProcessingResult = {
    matched_triggers: triggers?.length ?? 0,
    evaluations,
  }

  await supabase
    .from("events")
    .update({
      processed_at: new Date().toISOString(),
      processing_result: result,
    })
    .eq("id", eventId)

  return { event_id: eventId, result }
}
