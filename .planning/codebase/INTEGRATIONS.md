# External Integrations

**Analysis Date:** 2026-04-12

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - database, authentication, realtime subscriptions
  - Browser client: `@supabase/ssr` `createBrowserClient` via `src/lib/supabase/client.ts`
  - Server client: `@supabase/ssr` `createServerClient` via `src/lib/supabase/server.ts`
  - Middleware client: `@supabase/ssr` `createServerClient` via `src/lib/supabase/middleware.ts`
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Optional elevated key: `SUPABASE_SERVICE_ROLE_KEY` (documented in `.env.example`, not used in current source code)

## Data Storage

**Database:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js` / `@supabase/ssr`
  - Migrations: `supabase/migrations/` — 7 sequential SQL files:
    - `001_initial_schema.sql`
    - `002_saved_jobs.sql`
    - `003_messages.sql`
    - `004_recycle_bin.sql`
    - `005_job_type_and_experience.sql`
    - `006_qualifications.sql`
    - `007_fresh_grad.sql`
  - Seed data: `supabase/seed/`
  - Tables accessed in source: `job_listings`, `messages`, `conversations`

**File Storage:**
- Not used (no Supabase Storage calls, no S3/GCS imports detected in `src/`)

**Caching:**
- No Redis or in-memory cache layer
- Next.js build cache persisted as a Docker volume (`nextjs_cache`) in development via `docker-compose.yml`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Flow: OAuth PKCE code exchange — `src/app/api/auth/callback/route.ts` exchanges `code` param for a session
  - Session management: cookie-based via `@supabase/ssr`; cookies read/written in `src/lib/supabase/middleware.ts`
  - Middleware guard: `src/middleware.ts` calls `updateSession` on every non-static request; redirects unauthenticated users from protected paths to `/login`
  - Protected paths enforced in middleware: `/dashboard`, `/profile`, `/applications`, `/saved`, `/jobs/post`, `/messages`, `/recyclebin`
  - Client-side auth state: `src/hooks/useUser.ts` subscribes to `supabase.auth.onAuthStateChange`
  - Password reset: email-based flow handled by `src/components/auth/ResetPasswordForm.tsx` and `src/components/auth/UpdatePasswordForm.tsx`

## Realtime

**Supabase Realtime:**
- Used in `src/components/messages/MessageThread.tsx`
- Subscribes to `postgres_changes` INSERT events on the `messages` table filtered by `conversation_id`
- Channel name pattern: `messages:{conversationId}`
- Channel cleaned up via `supabase.removeChannel(channel)` on component unmount

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, LogRocket, or similar SDK)

**Logs:**
- Standard `console` only; no structured logging library

## CI/CD & Deployment

**Hosting:**
- Vercel — primary production platform
- Config: `vercel.json`

**CI Pipeline:**
- Not detected (no `.github/workflows/`, no CircleCI or similar config)

**Docker:**
- `Dockerfile` — multi-stage build: `development`, `builder`, `production` (all Node 20 Alpine)
- `docker-compose.yml` — local dev with source volume mount and hot-reload polling

## Scheduled Jobs (Cron)

**Vercel Cron:**
- Endpoint: `GET /api/cron/purge-deleted-jobs` — `src/app/api/cron/purge-deleted-jobs/route.ts`
- Schedule: `0 0 * * 0` (every Sunday at midnight UTC)
- Purpose: hard-deletes `job_listings` rows where `deleted_at` is older than 7 days (soft-delete cleanup)
- Auth: requires `Authorization: Bearer {CRON_SECRET}` header; returns 401 otherwise

## Environment Configuration

**Required environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (public, exposed to browser)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public API key (public, exposed to browser)
- `NEXT_PUBLIC_APP_URL` — Base URL of the app (e.g. `http://localhost:3000`)
- `CRON_SECRET` — Bearer token for authorizing Vercel cron requests (server-only, never expose to client)

**Optional environment variables:**
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for elevated server-side operations (documented in `.env.example`, not yet used in source)

**Secrets location:**
- Development: `.env.local` (gitignored; loaded via `env_file` in `docker-compose.yml`)
- Production: Vercel environment variable dashboard
- Reference template: `.env.example`

## API Routes

**Internal Next.js API routes:**
- `GET /api/auth/callback` — Supabase auth code exchange; redirects to `/dashboard` on success (`src/app/api/auth/callback/route.ts`)
- `GET /api/jobs` — Returns all active, non-deleted job listings (`src/app/api/jobs/route.ts`)
- `POST /api/jobs` — Creates a new job listing; requires auth; validates body with `jobSchema` (`src/app/api/jobs/route.ts`)
- `GET /api/cron/purge-deleted-jobs` — Vercel cron endpoint; requires `CRON_SECRET` bearer token (`src/app/api/cron/purge-deleted-jobs/route.ts`)

## Webhooks & Callbacks

**Incoming:**
- `GET /api/auth/callback` — Supabase OAuth redirect target
- `GET /api/cron/purge-deleted-jobs` — Vercel cron trigger

**Outgoing:**
- None detected

---

*Integration audit: 2026-04-12*
