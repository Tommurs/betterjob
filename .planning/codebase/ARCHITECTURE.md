# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Next.js 14 App Router with server-first rendering and Supabase for auth and database.

**Key Characteristics:**
- Server Components fetch data directly from Supabase — no intermediate service layer for page rendering
- Client Components are leaf-level interactive islands (`'use client'`) embedded in server-rendered pages
- Route Groups (`(auth)`, `(dashboard)`) organise pages without affecting URL paths and apply shared layouts
- Two-layer auth guard: middleware for fast edge redirect, dashboard layout for role resolution
- No global state management library — auth state is read server-side per request; client components use the Supabase browser client directly with `router.refresh()` after mutations

## Layers

**Routing / Pages:**
- Purpose: Define URL structure, fetch page-level data, compose components
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, `route.ts` (API) files, route groups, dynamic segments
- Depends on: `src/lib/supabase/server.ts`, `src/components/`, `src/lib/utils/`
- Used by: Next.js router, browsers

**Middleware:**
- Purpose: Session cookie refresh and first-pass route protection before any page renders
- Location: `src/middleware.ts` (entry), `src/lib/supabase/middleware.ts` (logic)
- Contains: `updateSession()` — reads Supabase cookies, re-validates session, checks protected path list, issues redirects
- Depends on: `@supabase/ssr`
- Used by: Every non-static request (matcher excludes `_next/static`, `_next/image`, and static assets)

**React Components:**
- Purpose: Reusable UI; server components render markup, client components handle interactivity
- Location: `src/components/`
- Contains: Feature-grouped subdirectories: `auth/`, `dashboard/`, `jobs/`, `layout/`, `messages/`, `profile/`, `forms/`, `ui/`
- Depends on: `src/lib/supabase/client.ts` (client components), props passed from server pages
- Used by: Pages and layouts

**Supabase Clients (Three Contexts):**
- Purpose: Provide the correct Supabase client for each execution environment
- Location: `src/lib/supabase/`
- Files:
  - `server.ts` — Server Components and Route Handlers; reads/writes cookies via `next/headers`
  - `client.ts` — Client Components; browser singleton via `createBrowserClient`
  - `middleware.ts` — Edge Middleware only; reads/writes via `NextRequest`/`NextResponse`
- Rule: Never import `server.ts` inside a `'use client'` component. Never import `client.ts` in a Server Component.

**Utilities and Validations:**
- Purpose: Shared pure helpers and Zod input schemas
- Location: `src/lib/utils/index.ts`, `src/lib/validations/`
- Contains: `cn()`, `formatSalary()`, `formatDate()`, `slugify()`; `jobSchema`, `loginSchema`, `signupSchema`, `resetPasswordSchema`
- Used by: Pages, API routes, components

**Types:**
- Purpose: Shared TypeScript interfaces for domain models
- Location: `src/types/index.ts`
- Contains: `UserRole`, `User`, `JobListing`, `Application`, `Profile`

**API Routes:**
- Purpose: Server-side endpoints for external triggers and mutations
- Location: `src/app/api/`
- Contains: `auth/callback/route.ts`, `jobs/route.ts`, `cron/purge-deleted-jobs/route.ts`

## Data Flow

**Public Page Render (e.g., homepage, job listings, job detail):**

1. Request arrives; middleware (`src/middleware.ts`) calls `updateSession` — refreshes Supabase session cookie and checks protected path list
2. Server Component (`src/app/page.tsx`, `src/app/jobs/page.tsx`, or `src/app/jobs/[id]/page.tsx`) calls `createClient()` from `src/lib/supabase/server.ts`
3. Page runs `Promise.all` to fetch job listings, user session, and saved job IDs in parallel
4. Passes fetched data as props to Client Component children (`SaveJobButton`, `ApplyButton`, `SearchBar`)
5. HTML is streamed to the browser; client components hydrate

**Authenticated Dashboard Render:**

1. Middleware checks path against `protectedPaths` list; redirects to `/login` if no session
2. Dashboard layout (`src/app/(dashboard)/layout.tsx`) independently calls `createClient()`, fetches `user` and `profile` (role, full name)
3. If no user, `redirect('/login')` (second guard — handles edge session timing cases)
4. Layout passes `role` and `fullName` to `<Sidebar>` (a Client Component)
5. Child `page.tsx` calls `createClient()` itself to fetch its own data (e.g., applications, posted jobs)

**Client-Side Mutation (apply for job, save/unsave, send message):**

1. User interaction triggers a handler in a Client Component
2. Component calls `createClient()` from `src/lib/supabase/client.ts` — browser client
3. Directly inserts or deletes a row in Supabase (`applications`, `saved_jobs`, `messages`)
4. On success, calls `router.refresh()` to re-run the Server Component data fetch without full navigation

**Auth Flow — Sign Up:**

1. `SignupForm` (`src/components/auth/SignupForm.tsx`) calls `supabase.auth.signUp()` with `emailRedirectTo: /api/auth/callback` and metadata `{ full_name, role }`
2. Supabase sends a confirmation email; user sees "check your email" state
3. User clicks email link → GET `/api/auth/callback?code=...` (`src/app/api/auth/callback/route.ts`)
4. Route handler calls `supabase.auth.exchangeCodeForSession(code)` to mint session cookies
5. Redirects to `/dashboard`

**Auth Flow — Sign In:**

1. `LoginForm` (`src/components/auth/LoginForm.tsx`) calls `supabase.auth.signInWithPassword({ email, password })`
2. Supabase sets session cookies via the browser client
3. `router.push('/dashboard')` + `router.refresh()` navigates the user

**Auth Flow — Sign Out:**

1. Client Component (`Sidebar` or `NavbarUserMenu`) calls `supabase.auth.signOut()`
2. Supabase browser client clears session cookies
3. `router.push('/')` + `router.refresh()` returns user to homepage

**State Management:**
- No global state store
- Auth state is read server-side on every request via `supabase.auth.getUser()` (validates token; does not use cached session)
- Client auth state: `useUser` hook (`src/hooks/useUser.ts`) subscribes to `onAuthStateChange` for reactive updates in the rare Client Components that need it
- UI state (modals, loading, form values, errors): local `useState` inside individual Client Components

## Key Abstractions

**Supabase Client Factory (Three Files):**
- Purpose: Correct Supabase client for each execution context; prevents cookie mishandling
- Files: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/middleware.ts`
- Pattern: Each file exports `createClient()`. Import from the file that matches your context. The import path is the signal — not a runtime flag.

**Route Groups with Shared Layouts:**
- Purpose: Apply distinct layout shells without adding URL path segments
- Files: `src/app/(auth)/`, `src/app/(dashboard)/layout.tsx`
- Pattern: `(auth)` routes share only the root layout (Navbar + Footer). `(dashboard)` routes additionally share `layout.tsx`, which enforces auth and renders the Sidebar. URLs are `/login`, `/dashboard` — no group name appears.

**Role-Based Branching:**
- Purpose: Show different dashboards, sidebar nav, and page content based on user role
- Files: `src/app/(dashboard)/dashboard/page.tsx`, `src/components/layout/Sidebar.tsx`
- Pattern: Server page fetches `profile.role` from Supabase, then either passes it as a prop (Sidebar) or renders a different component tree (`JobSeekerDashboard` vs `EmployerDashboard`). The two nav arrays `JOBSEEKER_NAV` and `EMPLOYER_NAV` are selected in `Sidebar.tsx` based on the `role` prop.

**Soft Delete / Recycle Bin:**
- Purpose: Employers can delete job listings without permanent loss; purge occurs after 7 days
- Files: `src/app/(dashboard)/recyclebin/page.tsx`, `src/app/api/cron/purge-deleted-jobs/route.ts`
- Pattern: `job_listings` rows get a `deleted_at` timestamp instead of being hard-deleted. All queries for live listings filter with `.is('deleted_at', null)`. A Vercel cron (weekly, `vercel.json`) calls the purge route which hard-deletes rows older than 7 days.

**Fresh Graduate Policy Badges:**
- Purpose: Job listings can signal openness to fresh graduates
- Files: `src/app/page.tsx`, `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`
- Pattern: `fresh_grad_policy` field on `job_listings` with values `fresh_grad` | `fresh_grad_plus`. Rendered as inline color-coded badge pills using constant maps `FRESH_GRAD_BADGE`.

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Applies Geist font variables, renders `<Navbar>` (async Server Component) and `<Footer>` around all page content

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every non-static request (configured via `matcher`)
- Responsibilities: Calls `updateSession` from `src/lib/supabase/middleware.ts` — refreshes cookies and redirects unauthenticated users away from the protected path list (`/dashboard`, `/profile`, `/applications`, `/saved`, `/jobs/post`, `/messages`, `/recyclebin`)

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Any route under `/(dashboard)/`
- Responsibilities: Second auth guard, fetches user profile (role + full name), renders `<Sidebar>` as a Client Component with those props

**OAuth Callback Route:**
- Location: `src/app/api/auth/callback/route.ts`
- Triggers: Supabase email confirmation redirect
- Responsibilities: Exchanges PKCE auth code for session, redirects to `/dashboard` on success or `/login?error=auth-callback-failed` on failure

## Error Handling

**Strategy:** Inline and component-local — no global error boundary or centralised error handler.

**Patterns:**
- Server pages: `notFound()` from `next/navigation` when a resource is missing or access is denied (e.g., `src/app/jobs/[id]/page.tsx` calls `notFound()` for deleted/inactive jobs the user does not own)
- Server pages: `redirect('/login')` as a secondary auth guard in layouts and pages
- API routes: `NextResponse.json({ error: error.message }, { status: N })` for all error paths
- Client components: local `error` state string displayed inline as a red-bordered paragraph
- Supabase SDK: every call returns `{ data, error }` — always check `error` before using `data`

## Cross-Cutting Concerns

**Logging:** None — no logging library. Errors are surfaced to the UI only; nothing is logged server-side.

**Validation:** Zod schemas in `src/lib/validations/`. `jobSchema` is used in `POST /api/jobs` route handler via `safeParse`. Auth schemas (`loginSchema`, `signupSchema`) are defined but auth forms currently validate manually in component state rather than using them — the schemas are not wired to the form submission handlers.

**Authentication:** Supabase Auth with cookie-based JWT sessions via `@supabase/ssr`. `supabase.auth.getUser()` is always used (not `getSession()`), which re-validates the JWT with Supabase servers on each call. Enforced at two layers: middleware redirect and layout/page-level redirect.

**Path Alias:** `@/` maps to `src/` (configured in `tsconfig.json`). Use `@/` imports throughout — never use relative paths that traverse up directories (e.g., `../../lib`).

---

*Architecture analysis: 2026-04-12*
