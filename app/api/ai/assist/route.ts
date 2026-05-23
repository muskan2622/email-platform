import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,

      env: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasResend: !!process.env.RESEND_API_KEY,
      },
    })
  } catch (err) {
    console.error("PLATFORM ROUTE ERROR:", err)

    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Unknown error",
      },
      { status: 500 }
    )
  }
}