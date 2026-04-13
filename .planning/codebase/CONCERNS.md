# Codebase Concerns

**Analysis Date:** 2026-04-12

---

## Incomplete / Stub Features

**Job Parser — empty directory, imports will crash:**
- Issue: Both `src/components/jobs/PostJobForm.tsx` and `src/components/jobs/EditJobForm.tsx` import `JobParser` from `@/components/jobs/JobParser`, but no such file exists. The import would cause a build or runtime error the moment those files are touched.
- Files: `src/components/jobs/PostJobForm.tsx` (line 6), `src/components/jobs/EditJobForm.tsx` (line 6)
- Impact: If Next.js tries to bundle these files the build will fail unless the import is currently being tree-shaken away. The `JobParser` component and its exported `ParsedJob` type are also referenced but undefined.
- Fix approach: Create a stub `src/components/jobs/JobParser.tsx` that exports the `ParsedJob` type and a no-op component, or remove the import until the feature is built.

**Empty API directories — dead route stubs:**
- Issue: Three API directories exist with no `route.ts` inside them: `src/app/api/applications/`, `src/app/api/parse-job/`, `src/app/api/users/`. These are placeholders with no implementation. The parse-job endpoint is the server-side counterpart to the missing JobParser component.
- Files: `src/app/api/applications/`, `src/app/api/parse-job/`, `src/app/api/users/`
- Impact: Any code that calls these endpoints will receive a 404. The parse-job endpoint in particular is needed for the AI parsing feature that is currently blocked.
- Fix approach: Implement or stub each route, or delete the directories to avoid confusion.

**Empty test directories:**
- Issue: `tests/`, `tests/e2e/`, `tests/integration/`, `tests/unit/` all exist but contain no files.
- Impact: Zero automated test coverage across the application.
- Fix approach: Add tests before launch; prioritise auth flows, RLS assumptions, and mutation paths.

**Empty `src/components/forms/` directory:**
- Issue: Directory exists with no content. Likely intended as a home for shared form primitives.
- Impact: No immediate breakage; creates confusion about where form logic lives.

**Empty `src/app/(dashboard)/jobs/` directory:**
- Issue: A `jobs` route exists under the dashboard group but contains no page file.
- Impact: Navigating to `/dashboard/jobs` (if ever linked) would 404. Unclear if this route was intentional.

---

## Tech Debt

**Stale `JobListing` type does not match the database schema:**
- Issue: `src/types/index.ts` defines `JobListing.type` as `'full_time' | 'part_time' | 'contract' | 'remote'`, but migration `005_job_type_and_experience.sql` replaced `'remote'` with `'temporary'` at the DB constraint level. The type is also missing all columns added by migrations 004-007: `deleted_at`, `experience_min`, `experience_max`, `required_degree`, `preferred_degree`, `preferred_qualifications`, `fresh_grad_policy`.
- Files: `src/types/index.ts`
- Impact: TypeScript provides no type safety for these fields; components access them with `(job as any).fresh_grad_policy` workarounds (e.g. `src/components/dashboard/JobSeekerDashboard.tsx` line 58, `src/app/jobs/[id]/applications/page.tsx` line 80).
- Fix approach: Update `JobListing` in `src/types/index.ts` to match the current schema. Remove all `as any` casts.

**`Profile` type has a spurious `user_id` field:**
- Issue: `src/types/index.ts` `Profile` interface includes `user_id: string`, but the `profiles` table uses `id` as the primary key (a direct FK to `auth.users`). There is no `user_id` column in the schema.
- Files: `src/types/index.ts`
- Impact: Misleads developers; code that relies on `profile.user_id` would silently get `undefined`.
- Fix approach: Remove `user_id` from the `Profile` interface.

**`jobSchema` in `src/lib/validations/job.ts` is severely out of date:**
- Issue: The Zod schema used by the `POST /api/jobs` route still validates `type` as `z.enum(['full_time', 'part_time', 'contract', 'remote'])` — `'remote'` is no longer valid at the DB level. It also omits all fields added in migrations 005-007: `experience_min`, `experience_max`, `required_degree`, `preferred_degree`, `preferred_qualifications`, `fresh_grad_policy`. The `PostJobForm` bypasses the API route entirely (writes directly to Supabase from the client) so this mismatch is currently silent, but any use of `POST /api/jobs` would reject valid payloads.
- Files: `src/lib/validations/job.ts`
- Impact: The API route cannot be used reliably. If server-side posting is added or enabled, validation will silently reject valid job types and strip valid new fields.
- Fix approach: Update `jobSchema` to `z.enum(['full_time', 'part_time', 'contract', 'temporary'])` and add all new optional fields.

**Massive duplication between `PostJobForm` and `EditJobForm`:**
- Issue: `src/components/jobs/PostJobForm.tsx` and `src/components/jobs/EditJobForm.tsx` share approximately 350 lines of near-identical code: the same `EXPERIENCE_OPTIONS`, `DEGREE_OPTIONS`, `JOB_TYPES`, `QualList` sub-component, validation logic, and form structure.
- Files: `src/components/jobs/PostJobForm.tsx`, `src/components/jobs/EditJobForm.tsx`
- Impact: Any change to form logic or options must be made in two places. Both already diverged slightly.
- Fix approach: Extract a shared `JobForm` base component or shared hooks and constants.

**`RecycleBin` and `SavedJobsPage` still reference the old `'remote'` job type:**
- Issue: `src/components/dashboard/RecycleBin.tsx` (line 25) and `src/app/(dashboard)/saved/page.tsx` (lines 8-18) define `JOB_TYPE_LABELS` and `JOB_TYPE_COLOURS` maps that still include `remote` as a key and exclude `temporary`.
- Files: `src/components/dashboard/RecycleBin.tsx`, `src/app/(dashboard)/saved/page.tsx`
- Impact: Any job with `type = 'temporary'` displays no label and no colour badge in these two views — renders an empty badge span.
- Fix approach: Replace `remote` with `temporary` in those maps, matching the rest of the codebase.

---

## Security Considerations

**No role enforcement on job posting UI — only RLS:**
- Issue: `src/app/jobs/post/page.tsx` and `src/app/jobs/[id]/edit/page.tsx` do not check `profile.role` before rendering. A jobseeker who navigates to `/jobs/post` manually will see the full form.
- Files: `src/app/jobs/post/page.tsx`, `src/app/jobs/[id]/edit/page.tsx`
- Current mitigation: The Supabase RLS policy `"Employers can insert jobs"` checks `auth.uid() = employer_id`, so a jobseeker's insert will be rejected. The data is safe.
- Recommendations: Add a server-side role check and redirect to `/dashboard` if `role !== 'employer'`. This eliminates the confusing UX where a jobseeker fills the form and hits an unexplained error.

**No RLS policy on `applications` table for UPDATE:**
- Issue: Migration `001_initial_schema.sql` grants applicants `SELECT`, `INSERT`, and `DELETE` on their own applications. There is no `UPDATE` policy for either applicants or employers. `StatusUpdater` is called by employers and updates `status` directly via the Supabase client from the browser. Without an UPDATE policy the write will be blocked by RLS in production.
- Files: `supabase/migrations/001_initial_schema.sql`, `src/components/jobs/StatusUpdater.tsx`
- Current mitigation: None identified. The missing policy means status updates are silently blocked in production.
- Recommendations: Add a migration: `create policy "Employers can update application status" on public.applications for update using (exists (select 1 from job_listings where id = job_id and employer_id = auth.uid()))`.

**Message `is_read` update policy is overly broad:**
- Issue: Migration `003_messages.sql` grants UPDATE on `messages` to anyone who is a participant in the conversation. This means either participant can update any field on any message in the thread, including messages they sent.
- Files: `supabase/migrations/003_messages.sql`
- Current mitigation: Only `is_read` is ever updated in practice (`src/app/messages/[id]/page.tsx` line 27-31), limiting real-world exposure.
- Recommendations: Tighten the policy to only allow updating messages where `auth.uid() != sender_id`.

**No conversations INSERT policy restricts creation to participants in an existing application:**
- Issue: The conversations INSERT policy (`003_messages.sql` line 31-33) only checks that the inserter is the `employer_id` or `applicant_id` they supply in the new row. Any authenticated user can create a conversation between any two arbitrary user IDs.
- Files: `supabase/migrations/003_messages.sql`
- Current mitigation: The UI only exposes `StartConversationButton` to verified employers viewing their own applications page, limiting the attack surface in normal use.
- Recommendations: Add a check that a valid `applications` row exists for the given `(job_id, applicant_id)` pair in the INSERT policy.

**Supabase writes directly from client components bypass API validation:**
- Issue: `PostJobForm`, `EditJobForm`, `ApplyButton`, `EmployerJobActions`, `RecycleBin`, `StatusUpdater`, `StartConversationButton`, `SaveJobButton`, `UnsaveButton`, and `ProfileForm` all write directly to Supabase from client components. The only server-side validation layer (`jobSchema`) is attached to `POST /api/jobs` which the forms do not use.
- Files: All of the above in `src/components/`
- Impact: Business logic validation is enforced only in client-side UI state. A user with direct Supabase credentials can bypass all validation.
- Recommendations: Acceptable for an early-stage app relying on RLS for security, but business-rule validation is not enforced at the DB level.

**`CRON_SECRET` guard will silently fail if env var is unset:**
- Issue: `src/app/api/cron/purge-deleted-jobs/route.ts` checks `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. If `CRON_SECRET` is not set, the check becomes `header !== "Bearer undefined"` — this blocks requests as expected, but the cron job will silently never run without any error surfaced.
- Files: `src/app/api/cron/purge-deleted-jobs/route.ts`
- Recommendations: Add an explicit guard at the top: `if (!process.env.CRON_SECRET) return NextResponse.json({ error: 'Misconfigured' }, { status: 500 })`.

---

## Missing Error Boundaries

**No React error boundaries anywhere in the component tree:**
- Issue: `src/app/layout.tsx` has no `error.tsx` sibling. No route segment defines an `error.tsx` file. The `(dashboard)/layout.tsx` and all pages rely on Next.js default unhandled error behaviour.
- Files: `src/app/layout.tsx`, `src/app/(dashboard)/layout.tsx`
- Impact: An uncaught render error in any client component will crash the full page with a generic Next.js error screen in production.
- Fix approach: Add `src/app/error.tsx` as a root error boundary and `src/app/(dashboard)/error.tsx` for the dashboard segment.

**No `loading.tsx` files:**
- Issue: No route segment defines a `loading.tsx` (Next.js Suspense boundary). All server components fetch data synchronously with no streaming or skeleton UI.
- Impact: Long Supabase queries block rendering entirely with no loading feedback to the user.
- Fix approach: Add `loading.tsx` stubs to `src/app/(dashboard)/`, `src/app/jobs/`, and `src/app/messages/`.

**No `not-found.tsx` customisation:**
- Issue: `notFound()` is called in `src/app/jobs/[id]/page.tsx` and `src/app/jobs/[id]/applications/page.tsx` but there is no `src/app/not-found.tsx` to customise the 404 experience.
- Files: `src/app/jobs/[id]/page.tsx`, `src/app/jobs/[id]/applications/page.tsx`

---

## Performance Concerns

**Jobs page fetches all columns with `select('*')`:**
- Issue: `src/app/jobs/page.tsx` and `src/app/api/jobs/route.ts` both use `.select('*')` on `job_listings`. This retrieves all columns including `description`, `requirements`, `preferred_qualifications` which are not displayed on listing cards.
- Files: `src/app/jobs/page.tsx` (line 42), `src/app/api/jobs/route.ts` (line 9)
- Impact: Overfetching grows linearly with the number of listings. Card renders pull significantly more data than they display.
- Fix approach: Select only card-needed columns: `id, title, company, location, type, salary_min, salary_max, created_at, fresh_grad_policy, deleted_at`.

**Messages page fetches all messages for all conversations in one query:**
- Issue: `src/app/messages/page.tsx` uses a nested select that retrieves all `messages` for every conversation simultaneously with no limit.
- Files: `src/app/messages/page.tsx` (line 13-20)
- Impact: For active users with many conversations and long message histories this becomes a large unbounded payload. Finding the last message also sorts all messages in JavaScript client-side (line 46).
- Fix approach: Fetch only the latest message per conversation via a subquery or RPC, rather than all messages.

**No pagination on job listings:**
- Issue: `src/app/jobs/page.tsx` fetches all matching jobs with no `.limit()` or pagination. The dashboard limits to 20 but the public jobs page has no cap.
- Files: `src/app/jobs/page.tsx`
- Impact: As listings grow, the public jobs page will degrade in load time.
- Fix approach: Add `.range(0, 49)` and implement cursor-based or page-based pagination.

**Full-text search uses `ilike` with leading wildcards:**
- Issue: The keyword search in `src/app/jobs/page.tsx` uses `.or('title.ilike.%q%,company.ilike.%q%,description.ilike.%q%')`. Leading-wildcard `ilike` queries cannot use B-tree indexes and force sequential scans.
- Files: `src/app/jobs/page.tsx` (line 53)
- Impact: Query performance degrades as the `job_listings` table grows.
- Fix approach: Add a PostgreSQL full-text search index (`tsvector` column) or use Supabase's `textsearch` filter.

---

## Migration State

**Migrations are manually tracked SQL files with no runner state:**
- Issue: The project uses numbered SQL files in `supabase/migrations/` (001 through 007) but there is no `supabase/config.toml` or evidence of `supabase db push` having been run. There is no migration history file indicating what has been applied to the hosted project.
- Files: `supabase/migrations/`
- Impact: It is not possible to determine from the repo alone which migrations have been applied to the production Supabase project. Applying them out of order or twice could corrupt the schema.
- Fix approach: Use `supabase db push` with the Supabase CLI and commit the generated migration history, or document in a README which migrations are confirmed applied.

**`005_job_type_and_experience.sql` alters a check constraint non-atomically:**
- Issue: Migration 005 drops the `type` constraint and re-adds it, then runs an `UPDATE` to fix existing data. If interrupted, the table briefly has no type constraint.
- Files: `supabase/migrations/005_job_type_and_experience.sql`
- Fix approach: Wrap in an explicit `BEGIN; ... COMMIT;` transaction block.

---

## Test Coverage Gaps

**Zero test coverage across the entire application:**
- What's not tested: Auth flows (signup, login, password reset), RLS policy correctness, job CRUD, application submission, message threading, cron purge logic.
- Files: All of `src/`
- Risk: Any regression in auth or data mutation paths is undetected until it reaches production.
- Priority: High

**RLS policies are untested:**
- What's not tested: That a jobseeker cannot insert a job listing, that an employer cannot view another employer's applications, that the conversations INSERT constraint works correctly.
- Files: `supabase/migrations/001_initial_schema.sql`, `supabase/migrations/003_messages.sql`
- Risk: Incorrectly permissive policies could expose private data silently.
- Priority: High

---

## Minor / Low-Priority Issues

**`slugify` utility is unused:**
- `src/lib/utils/index.ts` exports `slugify` but it is not imported anywhere in the codebase.
- Files: `src/lib/utils/index.ts`

**`EmployerJobActions.deleteJob` does not reset loading state on error:**
- `src/components/jobs/EmployerJobActions.tsx` `deleteJob` function sets `loading = true` and never resets it. If the Supabase update fails, the button stays disabled for the session.
- Files: `src/components/jobs/EmployerJobActions.tsx`

**`StartConversationButton` does not reset loading on error:**
- `src/components/messages/StartConversationButton.tsx` does not call `setLoading(false)` when the insert returns an error.
- Files: `src/components/messages/StartConversationButton.tsx`

**`MessageThread` does not surface send errors to the user:**
- `src/components/messages/MessageThread.tsx` `handleSend` ignores the returned `error` from the insert. A failed send is invisible to the user.
- Files: `src/components/messages/MessageThread.tsx`

**`StatusUpdater` ignores Supabase errors:**
- `src/components/jobs/StatusUpdater.tsx` shows the "Saved" confirmation even when the write fails.
- Files: `src/components/jobs/StatusUpdater.tsx`

---

*Concerns audit: 2026-04-12*
