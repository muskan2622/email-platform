# Deploy email-platform (live + Supabase)

This app is **Next.js** on the frontend/API and **Supabase (Postgres)** for live data. Deploy both, then wire env vars so dashboards read the same database you use locally.

## 1. Supabase (dynamic database)

You already have a Supabase project. For production:

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Run migrations in order (files under `supabase/migrations/`), **oldest first**:
   - `20250522000000_initial_schema.sql`
   - `20250522000001_seed_example.sql`
   - … through `20250524000003_ensure_automation_builder.sql`
3. Or install [Supabase CLI](https://supabase.com/docs/guides/cli) and run from `email-platform/`:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

4. Copy from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — never expose in client code)

Optional: `RESEND_*`, `OPENAI_*`, `EVENTS_API_KEY` for email, AI, and webhook auth.

## 2. GitHub

```bash
cd c:\projects\appcrafters
git remote add origin https://github.com/YOUR_USER/email-platform.git
git push -u origin main
```

`.env.local` is gitignored — add secrets only in Vercel/Supabase dashboards, not in the repo.

## 3. Vercel (live URL)

1. [vercel.com/new](https://vercel.com/new) → Import the GitHub repo.
2. **Root Directory**: `email-platform` (important — repo root is `appcrafters`).
3. **Environment variables** (Production + Preview):

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes |
| `OPENAI_API_KEY` | For AI assistant |
| `OPENAI_MODEL` | e.g. `gpt-4o-mini` |
| `RESEND_API_KEY` | For sending email |
| `RESEND_FROM_EMAIL` | Verified sender |
| `EVENTS_API_KEY` | For `/api/events` in production |

4. Deploy. Your live link will be like `https://email-platform-xxx.vercel.app`.

CLI (after `npx vercel login`):

```bash
cd email-platform
npx vercel --prod
```

Set the same env vars with `npx vercel env add`.

## 4. Verify live data

- Open the Vercel URL → dashboard should show Supabase metrics (not “Platform data unavailable”).
- **Events**, **Rules**, **Templates** pages should list rows from migrated/seeded tables.
- If empty, re-run seed migrations (`20250522000002_seed_demo_data.sql`, etc.) in Supabase SQL Editor.

## Security

- Never commit `.env.local`.
- Rotate any key that was ever pasted into chat or committed by mistake.
- Use `EVENTS_API_KEY` in production so event ingestion is not public.
