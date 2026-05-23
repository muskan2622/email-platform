import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,

      env: {
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        openaiStart:
          process.env.OPENAI_API_KEY?.slice(0, 10),

        model: process.env.OPENAI_MODEL,

        hasSupabaseUrl:
          !!process.env.NEXT_PUBLIC_SUPABASE_URL,

        hasAnon:
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

        hasServiceRole:
          !!process.env.SUPABASE_SERVICE_ROLE_KEY,

        hasResend:
          !!process.env.RESEND_API_KEY,
      },
    })
  } catch (err) {
    console.error("PLATFORM ERROR:", err)

    return NextResponse.json(
      {
        ok: false,

        realError:
          err instanceof Error
            ? err.message
            : "Unknown error",

        stack:
          process.env.NODE_ENV === "development"
            ? err
            : undefined,
      },
      { status: 500 }
    )
  }
}