export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

async function parseApiResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const contentType = res.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    const text = await res.text()
    const snippet = text.slice(0, 120).replace(/\s+/g, " ")
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(
        `Server returned HTML instead of JSON (${res.status}). The API route may have crashed — check the terminal running npm run dev.`
      )
    }
    throw new Error(
      snippet || `Request failed (${res.status} ${res.statusText})`
    )
  }

  try {
    return (await res.json()) as ApiResponse<T>
  } catch {
    throw new Error(`Invalid JSON from server (${res.status})`)
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const json = await parseApiResponse<T>(res)
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await parseApiResponse<T>(res)
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await parseApiResponse<T>(res)
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}
