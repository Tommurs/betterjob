# External Integrations

**Analysis Date:** 2026-04-12

## APIs & External Services

**Backend-as-a-Service:**
- Supabase — database, authentication, and real-time subscriptions
  - SDK/Client (browser): `@supabase/supabase-js`, `@supabase/ssr` via `src/lib/supabase/client.ts`
  - SDK/Client (server): `@supabase/ssr` via `src/lib/supabase/server.ts`
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Optional server-only key: `SUPABASE_SERVICE_ROLE_KEY` (documented in `.env.example`, not used in current source)

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: managed by `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` / `@supabase/ssr`
  - Migrations: `supabase/migrations/` (7 migration files, sequential numbered SQL)
    - `001_initial_schema.sql`
    - `002_saved_jobs.sql`
    - `003_messages.sql`
    - `004_recycle_bin.sql`
    - `005_job_type_and_experience.sql`
    - `006_qualifications.sql`
    - `007_fresh_grad.sql`
  - Seed data: `supabase/seed/`
  - Primary table confirmed in source: `job_listings`

**File Storage:**
- Not detected (no Supabase Storage SDK calls found; no S3/GCS imports)

**Caching:**
- Next.js build cache persisted via Docker volume (`nextjs_cache`) in development
- No explicit Redis or in-memory cache layer detected

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (built-in)
  - Implementation: OAuth code exchange flow — `src/app/api/auth/callback/route.ts`
  - Session management: cookie-based via `@supabase/ssr` middleware — `src/lib/supabase/middleware.ts`
  - Middleware guard: `src/middleware.ts` applies `updateSession` to all non-static routes
  - Login redirect target: `/dashboard` (default), `/login?error=auth-callback-failed` on failure

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar SDK imports found)

**Logs:**
- Standard Next.js/Node.js console logging only; no structured logging library detected

## CI/CD & Deployment

**Hosting:**
- Vercel — primary deployment platform
- Config: `vercel.json`

**CI Pipeline:**
- Not detected (no `.github/workflows/`, no CircleCI, no Bitbucket Pipelines config found)

**Docker:**
- Multi-stage `Dockerfile` present (development, builder, production targets)
- `docker-compose.yml` for local development with hot-reload via volume mounts

## Scheduled Jobs (Cron)

**Vercel Cron:**
- Endpoint: `GET /api/cron/purge-deleted-jobs` — `src/app/api/cron/purge-deleted-jobs/route.ts`
- Schedule: `0 0 * * 0` (weekly, every Sunday at midnight UTC)
- Purpose: Hard-deletes `job_listings` soft-deleted more than 7 days ago
- Auth: `Authorization: Bearer {CRON_SECRET}` header required

## Environment Configuration

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (public, exposed to browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key (public, exposed to browser)
- `NEXT_PUBLIC_APP_URL` — Base URL of the app (e.g. `http://localhost:3000`)
- `CRON_SECRET` — Secret token for authorizing Vercel cron job requests (server-only)

**Optional environment variables:**
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for elevated server-side access (documented in `.env.example`, not currently used in source)

**Secrets location:**
- Development: `.env.local` (gitignored, loaded via `env_file` in `docker-compose.yml`)
- Production: Vercel environment variable dashboard

**Reference template:**
- `.env.example` — documents all required vars with placeholder values

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/callback` — Supabase OAuth redirect callback (`src/app/api/auth/callback/route.ts`)
- `GET /api/cron/purge-deleted-jobs` — Vercel cron trigger (`src/app/api/cron/purge-deleted-jobs/route.ts`)

**Outgoing:**
- None detected

---

*Integration audit: 2026-04-12*
