import Handlebars from "handlebars"
import type { RenderContext } from "@/lib/types/database"

const compiled = new Map<string, HandlebarsTemplateDelegate>()

function compile(key: string, source: string) {
  let tpl = compiled.get(key)
  if (!tpl) {
    tpl = Handlebars.compile(source, { noEscape: false })
    compiled.set(key, tpl)
  }
  return tpl
}

export function renderTemplateString(
  source: string,
  context: RenderContext,
  cacheKey?: string
): string {
  const tpl = compile(cacheKey ?? source, source)
  return tpl(context)
}

export function renderEmail(
  subject: string,
  bodyHtml: string,
  bodyText: string | null | undefined,
  context: RenderContext
) {
  return {
    subject: renderTemplateString(subject, context, `sub:${subject}`),
    html: renderTemplateString(bodyHtml, context, `html:${bodyHtml}`),
    text: bodyText
      ? renderTemplateString(bodyText, context, `txt:${bodyText}`)
      : undefined,
  }
}

export function buildRenderContext(
  payload: Record<string, unknown>,
  user?: {
    email: string
    external_id: string
    metadata?: Record<string, unknown>
    unsubscribed_product?: boolean
  }
): RenderContext {
  const metadata = (user?.metadata ?? {}) as Record<string, unknown>
  return {
    ...payload,
    ...metadata,
    email: user?.email,
    user_id: user?.external_id,
    first_name: metadata.first_name ?? payload.first_name,
    plan_name: payload.plan_name ?? payload.plan ?? metadata.plan_name,
  }
}
