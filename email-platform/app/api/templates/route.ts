import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api/response"
import { createAdminClient } from "@/lib/supabase/admin"

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient()
  const q = request.nextUrl.searchParams.get("q")?.trim()
  const status = request.nextUrl.searchParams.get("status")

  let query = supabase
    .from("templates")
    .select("*")
    .order("updated_at", { ascending: false })

  if (status) query = query.eq("status", status)
  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%,subject.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) return jsonError(error.message, 500)
  return jsonOk(data)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body")
  }

  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return jsonError("name is required")

  const slug =
    typeof body.slug === "string" && body.slug.trim()
      ? body.slug.trim()
      : slugify(name)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("templates")
    .insert({
      slug,
      name,
      subject: typeof body.subject === "string" ? body.subject : "",
      body_html: typeof body.body_html === "string" ? body.body_html : "",
      body_text: typeof body.body_text === "string" ? body.body_text : null,
      status: typeof body.status === "string" ? body.status : "draft",
    })
    .select()
    .single()

  if (error) return jsonError(error.message, 400)
  return jsonOk(data, 201)
}
