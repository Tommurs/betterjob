# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Runner:** None configured.

No test framework is installed. `package.json` contains no testing dependencies (no Jest, Vitest, Playwright, Cypress, Testing Library, or any `@testing-library/*` package). There is no `jest.config.*`, `vitest.config.*`, `playwright.config.*`, or `cypress.config.*` file in the repository.

**Run Commands:** None available. `npm run lint` is the only quality script defined.

## Test File Organization

**No test files exist.** A search of the entire `src/` directory found zero `.test.*` or `.spec.*` files.

## What Is Tested

Nothing. There is zero automated test coverage in this codebase.

## What Is Not Tested

Every part of the application is untested:

**Authentication flows** (`src/components/auth/`):
- `LoginForm.tsx` — email/password sign-in, redirect on success, error display
- `SignupForm.tsx` — role selection, password confirmation, email confirmation success state
- `ResetPasswordForm.tsx` — reset request submission
- `UpdatePasswordForm.tsx` — password update flow

**Job management** (`src/components/jobs/`):
- `PostJobForm.tsx` — inline salary validation, experience range validation, `canSubmit` logic, tag selection, requirements list management
- `EditJobForm.tsx` — same validation logic as PostJobForm (duplicated), pre-population from existing job data
- `ApplyButton.tsx` — modal open/close, cover letter submission, applied state transition
- `SaveJobButton.tsx` / `UnsaveButton.tsx` — save/unsave toggle behaviour
- `EmployerJobActions.tsx` — archive/repost/delete flows

**Dashboard components** (`src/components/dashboard/`):
- `EmployerDashboard.tsx` — optimistic job deletion, repost into active list, local state sync
- `JobSeekerDashboard.tsx` — application list display
- `RecycleBin.tsx` — soft-deleted jobs display and restore

**Profile** (`src/components/profile/`):
- `ProfileForm.tsx` — skills list management, role-conditional field display, save feedback

**API routes** (`src/app/api/`):
- `src/app/api/jobs/route.ts` — GET (listing query), POST (Zod validation, auth check, insert)
- `src/app/api/cron/purge-deleted-jobs/route.ts` — purge logic for soft-deleted jobs

**Validation schemas** (`src/lib/validations/`):
- `src/lib/validations/job.ts` — `jobSchema` rules (min lengths, required fields, positive numbers)
- `src/lib/validations/auth.ts` — `loginSchema`, `signupSchema` (password match refine), `resetPasswordSchema`

**Utility functions** (`src/lib/utils/index.ts`):
- `cn()` — clsx + tailwind-merge combination
- `formatSalary()` — null/undefined handling, single-bound formatting, currency formatting
- `formatDate()` — locale date formatting
- `slugify()` — text-to-slug transformation

**Hooks** (`src/hooks/`):
- `useUser.ts` — auth state subscription, loading state, session change handling
- `useSupabase.ts` — memoised client creation

**Middleware** (`src/middleware.ts`):
- Session update / cookie refresh logic from `@/lib/supabase/middleware`

**Page-level server components** (`src/app/`):
- Auth redirect logic in `src/app/(dashboard)/layout.tsx`
- Search/filter query building in `src/app/jobs/page.tsx`
- Owner vs. visitor access control in `src/app/jobs/[id]/page.tsx`

## Coverage Gaps by Risk Level

**High risk (complex logic with no tests):**

- Inline validation in `PostJobForm.tsx` and `EditJobForm.tsx` — salary min/max cross-field validation and experience range ordering are duplicated between these two files and contain multiple edge cases. Any future change risks regression with no safety net.
- `canSubmit` gate logic — a boolean derived from 8+ conditions; easy to break silently.
- API route auth and validation in `src/app/api/jobs/route.ts` — Zod parse, auth check, and insert are untested server-side.
- Soft-delete and purge logic in `src/app/api/cron/purge-deleted-jobs/route.ts` — data-destructive operation with no coverage.

**Medium risk:**

- `formatSalary()` and `formatDate()` in `src/lib/utils/index.ts` — pure functions, easy to unit test, currently not tested. Edge cases (undefined min, undefined max, both undefined) are handled in code but not verified.
- Zod schemas in `src/lib/validations/` — schema rules are defined but the `signupSchema` password-match `.refine()` and field constraints are not tested.
- Optimistic UI logic in `EmployerDashboard.tsx` — `handleDelete` and `handleRepost` mutate local state arrays; correctness relies on visual inspection only.

**Lower risk (presentational, easier to verify manually):**

- Layout components (`Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx`)
- Static page content (`src/app/page.tsx`)

## Recommended Starting Points

If tests are introduced, the highest-value targets in order:

1. **Unit tests for `src/lib/utils/index.ts`** — pure functions, no mocking needed, immediate value.
2. **Unit tests for Zod schemas** in `src/lib/validations/auth.ts` and `src/lib/validations/job.ts` — pure schema validation, no dependencies.
3. **Unit tests for validation logic extracted from `PostJobForm`/`EditJobForm`** — the salary and experience cross-field validation IIFEs should be extracted to `src/lib/utils/` and tested independently.
4. **Integration tests for `src/app/api/jobs/route.ts`** — test auth rejection, Zod failure paths, and successful insert with a mocked Supabase client.
5. **E2E tests for critical user journeys** — sign up, post a job, apply to a job — using Playwright against a test Supabase project.

## Framework Recommendations (if adopting tests)

Given the Next.js 14 + Supabase stack:

- **Unit/integration:** Vitest — faster than Jest, native ESM support, compatible with `"module": "esnext"` tsconfig
- **E2E:** Playwright — first-class Next.js support, can test server components and API routes
- **Supabase mocking:** `@supabase/supabase-js` can be mocked with `vi.mock()` in Vitest; for integration tests use a dedicated Supabase test project with Row Level Security disabled

---

*Testing analysis: 2026-04-12*
