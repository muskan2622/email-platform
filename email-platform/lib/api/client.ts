export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path)
  const json = (await res.json()) as ApiResponse<T>
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as ApiResponse<T>
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as ApiResponse<T>
  if (!json.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
  return json.data
}
