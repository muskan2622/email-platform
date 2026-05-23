import Handlebars from "handlebars"
import type { RenderContext } from "@/lib/types/database"

const compiled = new Map<string, HandlebarsTemplateDelegate>()
let helpersRegistered = false

export class TemplateRenderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TemplateRenderError"
  }
}

function registerHandlebarsHelpers() {
  if (helpersRegistered) return
  helpersRegistered = true

  Handlebars.registerHelper("formatDate", (value: unknown, options: Handlebars.HelperOptions) => {
    if (value == null || value === "") return ""
    const date = value instanceof Date ? value : new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    const format = typeof options.hash?.format === "string" ? options.hash.format : "medium"
    const presets: Record<string, Intl.DateTimeFormatOptions> = {
      short: { dateStyle: "short" },
      medium: { dateStyle: "medium" },
      long: { dateStyle: "long" },
      full: { dateStyle: "full" },
    }
    return new Intl.DateTimeFormat("en-US", presets[format] ?? presets.medium).format(date)
  })
}

function compile(key: string, source: string) {
  registerHandlebarsHelpers()
  let tpl = compiled.get(key)
  if (!tpl) {
    try {
      tpl = Handlebars.compile(source, { noEscape: false })
    } catch (err) {
      throw new TemplateRenderError(
        err instanceof Error ? err.message : "Invalid template syntax"
      )
    }
    compiled.set(key, tpl)
  }
  return tpl
}

export function renderTemplateString(
  source: string,
  context: RenderContext,
  cacheKey?: string
): string {
  try {
    const tpl = compile(cacheKey ?? source, source)
    return tpl(context)
  } catch (err) {
    if (err instanceof TemplateRenderError) throw err
    throw new TemplateRenderError(
      err instanceof Error ? err.message : "Template render failed"
    )
  }
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
  const payloadUser =
    payload.user && typeof payload.user === "object"
      ? (payload.user as Record<string, unknown>)
      : {}
  const payloadMeta =
    payloadUser.metadata && typeof payloadUser.metadata === "object"
      ? (payloadUser.metadata as Record<string, unknown>)
      : {}

  return {
    ...payload,
    ...metadata,
    email: user?.email ?? payload.email,
    user_id: user?.external_id ?? payload.user_id,
    first_name: metadata.first_name ?? payload.first_name,
    plan_name: payload.plan_name ?? payload.plan ?? metadata.plan_name,
    user: {
      ...payloadUser,
      email: user?.email ?? payloadUser.email,
      metadata: { ...payloadMeta, ...metadata },
    },
  }
}
