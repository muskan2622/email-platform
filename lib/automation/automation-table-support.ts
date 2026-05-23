import type { SupabaseClient } from "@supabase/supabase-js"

export function isMissingAutomationTableError(message: string): boolean {
  return (
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("Could not find the table")
  )
}

/** Whether normalized wizard tables (condition groups, actions) exist. */
export async function hasNormalizedAutomationTables(
  supabase: SupabaseClient
): Promise<boolean> {
  const { error } = await supabase
    .from("automation_condition_groups")
    .select("id")
    .limit(0)

  if (!error) return true
  return !isMissingAutomationTableError(error.message)
}
