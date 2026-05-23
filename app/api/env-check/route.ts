export async function GET() {
  return Response.json({
    hasKey: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL,
    keyStart: process.env.OPENAI_API_KEY?.slice(0, 10),
  });
}
