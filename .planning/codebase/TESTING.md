# Testing Patterns

**Analysis Date:** 2026-04-12

## Test Framework

**Runner:** None installed.

No testing framework, assertion library, or test runner is present in `package.json` (no Jest, Vitest, Playwright, Cypress, or `@testing-library/*` dependencies). There are no test config files (`jest.config.*`, `vitest.config.*`, `playwright.config.*`, `cypress.config.*`).

**Run Commands:**
```bash
# No test commands defined in package.json scripts
# Only available scripts:
npm run dev       # Next.js dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
```

## Test File Organization

**Location:** A `tests/` directory exists at the project root with three subdirectories:
```
tests/
├── e2e/           # empty
├── integration/   # empty
└── unit/          # empty
```

All three directories are **empty** — no test files have been written.

**No co-located test files** exist alongside source files (`*.test.ts`, `*.spec.tsx`, etc.).

## What Is Tested

**Nothing is tested.** There are no test files in the codebase.

## What Is Not Tested (Full Coverage Gap)

Every area of the application lacks test coverage:

**Utility Functions** (`src/lib/utils/index.ts`):
- `cn()` — class merging
- `formatSalary()` — currency formatting with edge cases (no min, no max, both)
- `formatDate()` — date formatting
- `slugify()` — string transformation

**Validation Schemas** (`src/lib/validations/`):
- `jobSchema` — salary range logic, required fields, minimum lengths (`src/lib/validations/job.ts`)
- `loginSchema`, `signupSchema`, `resetPasswordSchema` — password matching, email format (`src/lib/validations/auth.ts`)

**API Routes** (`src/app/api/`):
- `GET /api/jobs` — job listing retrieval (`src/app/api/jobs/route.ts`)
- `POST /api/jobs` — job creation with auth check, schema validation (`src/app/api/jobs/route.ts`)
- `GET /api/auth/callback` — OAuth callback (`src/app/api/auth/callback/route.ts`)
- `POST /api/cron/purge-deleted-jobs` — purge cron job (`src/app/api/cron/purge-deleted-jobs/route.ts`)

**Client Components** (`src/components/`):
- `ApplyButton` — apply flow, modal open/close, form submission (`src/components/jobs/ApplyButton.tsx`)
- `PostJobForm` — field validation, salary/experience range logic, form submission (`src/components/jobs/PostJobForm.tsx`)
- `LoginForm` — submit handler, error display (`src/components/auth/LoginForm.tsx`)
- `SignupForm` — role selection, password confirmation (`src/components/auth/SignupForm.tsx`)
- `SaveJobButton` — toggle save/unsave, optimistic update (`src/components/jobs/SaveJobButton.tsx`)
- `StatusUpdater` — application status change flow (`src/components/jobs/StatusUpdater.tsx`)
- `SearchBar` — query/location state, URL navigation (`src/components/jobs/SearchBar.tsx`)
- `EmployerDashboard` — archive/repost/delete flows (`src/components/dashboard/EmployerDashboard.tsx`)
- `RecycleBin` — restore and permanent delete flows (`src/components/dashboard/RecycleBin.tsx`)

**Custom Hooks** (`src/hooks/`):
- `useUser()` — auth state subscription, loading state (`src/hooks/useUser.ts`)
- `useSupabase()` — client memoization (`src/hooks/useSupabase.ts`)

**Server Components / Pages:**
- Auth guards (`redirect('/login')` when no user) across dashboard pages
- Role-based rendering in `DashboardPage` (`src/app/(dashboard)/dashboard/page.tsx`)
- Job detail page data fetching (`src/app/jobs/[id]/page.tsx`)

## Testing Infrastructure Status

| Area | Status |
|------|--------|
| Unit test runner | Not installed |
| Integration test runner | Not installed |
| E2E test runner | Not installed |
| Test utilities / mocks | Not installed |
| CI test pipeline | Not detected |
| Coverage reporting | Not configured |
| Test directory scaffold | Present (empty) |

## Recommendations for Adding Tests

The directory scaffold (`tests/unit/`, `tests/integration/`, `tests/e2e/`) signals intent. When adding a test framework:

**Best fit for this stack:**
- **Unit/Integration:** Vitest (fast, ESM-native, compatible with Next.js) + `@testing-library/react`
- **E2E:** Playwright (official Next.js E2E recommendation)

**Highest-value first targets:**
1. `src/lib/utils/index.ts` — pure functions, easiest to unit test, high reuse
2. `src/lib/validations/` — pure Zod schema tests for edge cases
3. `src/app/api/jobs/route.ts` — API route integration tests with mocked Supabase
4. `src/components/auth/LoginForm.tsx` — form interaction and error display

---

*Testing analysis: 2026-04-12*
