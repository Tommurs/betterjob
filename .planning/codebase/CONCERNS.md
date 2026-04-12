# Codebase Concerns

**Analysis Date:** 2026-04-12

---

## HIGH Severity

### Broken Import: `JobParser` Component Does Not Exist

- **Issue:** Both `PostJobForm.tsx` and `EditJobForm.tsx` import `JobParser` and the `ParsedJob` type from `@/components/jobs/JobParser`, but that file does not exist anywhere in the project. The import is dead and the symbol is never used in either file's JSX, suggesting this was a planned feature that was stubbed but never built.
- **Files:**
  - `src/components/jobs/PostJobForm.tsx` (line 6)
  - `src/components/jobs/EditJobForm.tsx` (line 6)
- **Impact:** TypeScript will error at build time if strict module resolution is enforced. The `parse-job` API directory (`src/app/api/parse-job/`) also exists but is empty, confirming this feature is entirely incomplete.
- **Fix approach:** Either implement `JobParser` (a component that accepts raw job description text and parses it into structured fields) and the `/api/parse-job` route handler, or remove both imports and the empty API directory until the feature is prioritized.

---

### `CRON_SECRET` Not Documented in `.env.example`

- **Issue:** The cron purge endpoint (`src/app/api/cron/purge-deleted-jobs/route.ts`) reads `process.env.CRON_SECRET` for authorization, but `CRON_SECRET` is absent from `.env.example`. A developer deploying a new instance has no indication this variable is required.
- **Files:**
  - `src/app/api/cron/purge-deleted-jobs/route.ts` (line 8)
  - `.env.example`
- **Impact:** If `CRON_SECRET` is not set in production, `process.env.CRON_SECRET` is `undefined`. The header check becomes `Bearer undefined`, which means any request with the literal string `"Bearer undefined"` in the Authorization header would succeed — effectively bypassing the guard.
- **Fix approach:** Add `CRON_SECRET=your-cron-secret-here` to `.env.example`. In the route, add a startup guard that returns 500 if the env var is missing rather than falling through to a string comparison with `undefined`.

---

### RLS Policy Mismatch: Owners Cannot Read Inactive Listings via RLS

- **Issue:** The RLS policy on `job_listings` for SELECT is `is_active = true` (set in `supabase/migrations/001_initial_schema.sql`, line 62). However, `src/app/jobs/[id]/page.tsx` queries a job without filtering by `is_active`, relying on the application layer to handle visibility — including inactive listings for owners and the soft-delete check. Supabase RLS operates at the database level, so when an employer views their own inactive listing, the SELECT may be blocked by RLS unless a second policy explicitly allows owners to read their own records regardless of `is_active`.
- **Files:**
  - `supabase/migrations/001_initial_schema.sql` (lines 62–65)
  - `src/app/jobs/[id]/page.tsx` (lines 44–55)
  - `src/app/jobs/[id]/edit/page.tsx` (lines 12–16)
- **Impact:** Employers may silently get 404s when trying to view or edit their own closed/inactive listings because the RLS SELECT policy blocks the row. The application-layer ownership check (`employer_id = user.id`) never runs if RLS rejects the row first.
- **Fix approach:** Add a second RLS SELECT policy: `"Employers can view own jobs" on public.job_listings for select using (auth.uid() = employer_id)`. This runs alongside the public active-jobs policy.

---

### `ApplyButton` Inserts Without Sending `applicant_id`

- **Issue:** `src/components/jobs/ApplyButton.tsx` calls `supabase.from('applications').insert({ job_id, cover_letter })` without including `applicant_id`. The RLS INSERT policy requires `auth.uid() = applicant_id`, and the DB schema has `applicant_id` as NOT NULL. This means the insert will fail unless a DB trigger or default populates `applicant_id` from `auth.uid()` — no such trigger exists in the migrations.
- **Files:**
  - `src/components/jobs/ApplyButton.tsx` (lines 37–43)
  - `supabase/migrations/001_initial_schema.sql` (lines 39–49, 71)
- **Impact:** Every job application submission from the client will silently fail (the error is caught and shown as a generic "Something went wrong" message).
- **Fix approach:** Add `applicant_id: currentUserId` to the insert payload. The `currentUserId` prop already exists on the component but is not being forwarded to the insert. Alternatively, use a server action.

---

## MEDIUM Severity

### Pervasive `any` Type Casting Suppresses Type Safety

- **Issue:** Throughout the codebase, Supabase query results are cast to `any` in multiple places. Notable examples: `applications!.map((app: any)` in `src/app/jobs/[id]/applications/page.tsx` (line 80), `(conv: any)` in `src/app/messages/page.tsx` (line 44), `(entry: any)` in `src/app/(dashboard)/saved/page.tsx` (line 60), and nested `as any` casts in `src/app/messages/[id]/page.tsx` (lines 33–35). The `src/types/index.ts` defines interfaces that are not used to type these query results.
- **Files:**
  - `src/app/jobs/[id]/applications/page.tsx`
  - `src/app/messages/page.tsx`
  - `src/app/messages/[id]/page.tsx`
  - `src/app/(dashboard)/saved/page.tsx`
  - `src/app/(dashboard)/dashboard/page.tsx`
- **Impact:** Runtime errors from shape mismatches will not be caught at compile time. Refactoring DB schema columns is risky.
- **Fix approach:** Use Supabase's generated types (run `supabase gen types typescript`) and type query results against those generated types or the interfaces in `src/types/index.ts`.

---

### `StatusUpdater` Performs Client-Side DB Update Without Auth Check

- **Issue:** `src/components/jobs/StatusUpdater.tsx` calls `supabase.from('applications').update({ status }).eq('id', applicationId)` directly from the client. There is no RLS UPDATE policy on `applications` in any migration, meaning any authenticated user who can guess an `applicationId` UUID could update any application's status.
- **Files:**
  - `src/components/jobs/StatusUpdater.tsx` (lines 30–34)
  - `supabase/migrations/001_initial_schema.sql` (no UPDATE policy for applications)
- **Impact:** Job seekers can change their own application status (e.g., set themselves to `offered`). Any user who obtains a UUID can manipulate other users' application records.
- **Fix approach:** Add an RLS UPDATE policy restricting status changes to employers who own the job: `using (exists (select 1 from job_listings where id = job_id and employer_id = auth.uid()))`. Consider moving this to a server action.

---

### `EmployerJobActions.deleteJob` Leaks Loading State on Navigation

- **Issue:** In `src/components/jobs/EmployerJobActions.tsx`, `deleteJob()` sets `loading = true` then calls `router.push('/dashboard')` without ever setting `loading = false`. If navigation is slow or the component stays mounted, the button remains disabled indefinitely with no reset path.
- **Files:** `src/components/jobs/EmployerJobActions.tsx` (lines 27–35)
- **Impact:** Minor UX issue — button appears stuck in loading state.
- **Fix approach:** Add `setLoading(false)` before `router.push`, or use a try/finally block.

---

### `messages` Are Sorted Client-Side on Every Render

- **Issue:** In `src/app/messages/page.tsx` (line 46), the messages array for each conversation is sorted inline inside `.map()` using `.sort()`. This mutates the underlying array in place (JavaScript's `sort` is not pure) and runs on every render pass.
- **Files:** `src/app/messages/page.tsx` (lines 46–48)
- **Impact:** Potential for subtle ordering bugs when the array is reused, and unnecessary computation per render.
- **Fix approach:** Sort at the query level (`.order('created_at', { ascending: false })` on the nested messages select), or use `[...messages].sort(...)` to avoid mutation.

---

### `PostJobPage` Passes Empty String for `companyName`

- **Issue:** `src/app/jobs/post/page.tsx` fetches the employer's profile including `full_name` but passes `companyName=""` to `PostJobForm` instead of `profile?.full_name`. The intent is clearly to pre-fill the company name field.
- **Files:**
  - `src/app/jobs/post/page.tsx` (line 26)
  - `src/components/jobs/PostJobForm.tsx` (lines 53, 57–58)
- **Impact:** Employers must always manually type their company name, even after setting it in their profile.
- **Fix approach:** Change `<PostJobForm companyName="" />` to `<PostJobForm companyName={profile?.full_name ?? ''} />`.

---

### Category Filter Links on Homepage Do Not Work

- **Issue:** `src/app/page.tsx` renders "Browse by category" links with `href={'/jobs?category=' + cat.label.toLowerCase()}`. However, `src/app/jobs/page.tsx` does not read or apply a `category` search param — only `q`, `location`, and `type` are handled. Clicking a category link navigates to `/jobs?category=engineering` but returns unfiltered results.
- **Files:**
  - `src/app/page.tsx` (lines 7–14, 82–84)
  - `src/app/jobs/page.tsx` (lines 35–53)
- **Impact:** The category browsing feature silently does nothing. Users see all jobs regardless of which category they click.
- **Fix approach:** Either (a) remove the category links until categories are implemented on the job listing schema and query layer, or (b) map category values to `q` param queries as a short-term workaround (`/jobs?q=engineering`).

---

### `slugify` Utility Is Unused

- **Issue:** `src/lib/utils/index.ts` exports a `slugify` function that is not imported or used anywhere in the codebase.
- **Files:** `src/lib/utils/index.ts` (lines 21–23)
- **Impact:** Dead code. Low risk but adds noise.
- **Fix approach:** Remove unless a slug-based URL feature is planned.

---

### `resume_url` Field Exists in Schema and Types but Is Never Used

- **Issue:** The `applications` table has a `resume_url` column (migration 001, line 46). The `Application` interface in `src/types/index.ts` includes `resume_url?: string`. Neither the `ApplyButton` component nor any application view reads or writes this field.
- **Files:**
  - `src/types/index.ts` (line 34)
  - `src/components/jobs/ApplyButton.tsx`
  - `supabase/migrations/001_initial_schema.sql` (line 46)
- **Impact:** Resume upload is a planned or dropped feature. Employers cannot see resumes; applicants cannot submit them.
- **Fix approach:** Either implement resume upload (requires file storage configuration) or remove the column and type field if the feature is dropped.

---

### `JobListing` Type in `types/index.ts` Is Out of Sync with Schema

- **Issue:** `src/types/index.ts` defines `JobListing.type` as `'full_time' | 'part_time' | 'contract' | 'remote'`. The actual DB constraint (migration 001) matches this, but the UI forms, filter pills, and badge maps all include `'temporary'` as a valid type. The type definition is stale and does not reflect the schema as extended by `005_job_type_and_experience.sql`.
- **Files:**
  - `src/types/index.ts` (line 17)
  - `supabase/migrations/005_job_type_and_experience.sql`
  - `src/components/jobs/PostJobForm.tsx` (line 8–13)
- **Impact:** TypeScript would flag `'temporary'` as an invalid type if `JobListing` were actually used to type query results.
- **Fix approach:** Update the union type in `src/types/index.ts` to include `'temporary'`. Adopt generated Supabase types to keep this in sync automatically.

---

### `src/app/(dashboard)/jobs/` Directory Is Empty

- **Issue:** The directory `src/app/(dashboard)/jobs/` exists but contains no files. This appears to be a scaffolded but unused route group.
- **Files:** `src/app/(dashboard)/jobs/`
- **Impact:** No runtime impact. Causes confusion about whether dashboard-scoped job routes were intended.
- **Fix approach:** Remove the empty directory, or implement any intended dashboard-level job management pages inside it.

---

## LOW Severity

### No Tests Exist — Test Directories Are Empty

- **Issue:** The `tests/` directory contains three subdirectories (`e2e/`, `integration/`, `unit/`) but no test files of any kind.
- **Files:** `tests/`
- **Impact:** No automated coverage. Regressions in auth flows, application submission, RLS behavior, or cron logic will not be caught automatically.
- **Fix approach:** Prioritize unit tests for `src/lib/utils/index.ts` and `src/lib/validations/`, then integration tests for API routes, and E2E tests for the apply and post-job flows.

---

### No Rate Limiting on Public-Facing API Routes or Auth Endpoints

- **Issue:** `src/app/api/jobs/route.ts` (GET, POST) has no rate limiting. Auth endpoints are handled by Supabase Auth directly, but the Next.js middleware (`src/lib/supabase/middleware.ts`) adds no request throttling layer.
- **Files:**
  - `src/app/api/jobs/route.ts`
  - `src/middleware.ts`
- **Impact:** The job listing POST endpoint could be abused to spam listings. The GET endpoint could be scraped without limit.
- **Fix approach:** Use Vercel's edge rate limiting or an in-memory token bucket via middleware for the POST endpoint.

---

### `next.config.mjs` Is Effectively Empty

- **Issue:** `next.config.mjs` contains only an empty config object with no security headers, image domain allowlists, or redirects configured.
- **Files:** `next.config.mjs`
- **Impact:** Missing security headers (`X-Frame-Options`, `Content-Security-Policy`, etc.) that are typically set at this layer.
- **Fix approach:** Add `headers()` function returning baseline security headers. Configure `images.remotePatterns` if avatar URL uploads are added.

---

### `NEXT_PUBLIC_APP_URL` Is Defined in `.env.example` but Never Read

- **Issue:** `.env.example` documents `NEXT_PUBLIC_APP_URL` but no source file reads `process.env.NEXT_PUBLIC_APP_URL`. The reset-password flow hardcodes the redirect URL via Supabase's `resetPasswordForEmail` with a relative path.
- **Files:**
  - `.env.example`
  - `src/components/auth/ResetPasswordForm.tsx`
- **Impact:** Dead env var documentation. The reset-password redirect URL is not configurable without code change.
- **Fix approach:** Either use `NEXT_PUBLIC_APP_URL` in the reset password redirect, or remove it from `.env.example` to avoid confusion.

---

### `MessageThread` Real-Time Subscription Does Not Deduplicate Messages

- **Issue:** `src/components/messages/MessageThread.tsx` subscribes to `postgres_changes` INSERT events and appends new messages via `setMessages(prev => [...prev, payload.new])`. If the sender's own insert comes through the real-time channel before the `setSending(false)` state update, the message may appear twice — once from optimistic local state and once from the subscription event.
- **Files:** `src/components/messages/MessageThread.tsx` (lines 34–47, 57–63)
- **Impact:** Occasional duplicate messages visible to the sender.
- **Fix approach:** Filter incoming real-time events against existing message IDs before appending: `setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new as Message])`.

---

### `conversations` Insert RLS Allows Any Participant to Create a Conversation

- **Issue:** Migration 003 sets: `with check (auth.uid() = employer_id or auth.uid() = applicant_id)`. This means a job seeker could call the `conversations` table directly and create a conversation as the `employer_id` party, or set arbitrary `employer_id`/`applicant_id` values.
- **Files:** `supabase/migrations/003_messages.sql` (lines 31–33)
- **Impact:** RLS does not enforce that the `employer_id` column actually belongs to an employer role, or that the `applicant_id` has a pending application for the given job. Conversations can be fabricated between arbitrary user pairs.
- **Fix approach:** Tighten the INSERT check to verify the caller is inserting themselves as `employer_id` AND has employer role, or restrict conversation creation to a server action/API route that validates the application relationship before inserting.

---

*Concerns audit: 2026-04-12*
