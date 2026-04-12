# Architecture

**Analysis Date:** 2026-04-12

## Pattern Overview

**Overall:** Server-first Next.js App Router with Supabase as the backend

**Key Characteristics:**
- Server Components handle all data fetching — pages query Supabase directly using `createClient()` from `src/lib/supabase/server.ts`
- Client Components are used only where interactivity is required (forms, buttons, sidebar navigation)
- No API layer for most reads — server pages call Supabase directly and pass data as props to client components
- Route Groups `(auth)` and `(dashboard)` provide layout scoping without affecting URL paths
- Auth is enforced at two levels: middleware (redirect unauthenticated users) and layout/page level (secondary `redirect()` guard)

## Layers

**Routing Layer:**
- Purpose: URL structure, layout nesting, code splitting
- Location: `src/app/`
- Contains: `page.tsx`, `layout.tsx`, route groups `(auth)`, `(dashboard)`, dynamic segments `[id]`
- Depends on: Components layer, Supabase server client
- Used by: Next.js router

**Middleware Layer:**
- Purpose: Session refresh and route protection before page render
- Location: `src/middleware.ts`, `src/lib/supabase/middleware.ts`
- Contains: `updateSession()` — reads/writes Supabase auth cookies, redirects unauthenticated users away from protected paths
- Depends on: `@supabase/ssr`
- Used by: Every non-static request (matcher excludes `_next/static`, `_next/image`, images)

**Component Layer:**
- Purpose: UI — both server-renderable display components and interactive client components
- Location: `src/components/`
- Contains: Feature-grouped subdirectories (`auth/`, `dashboard/`, `jobs/`, `layout/`, `messages/`, `profile/`)
- Depends on: Supabase client (browser), hooks, utils
- Used by: Pages in `src/app/`

**Data / Library Layer:**
- Purpose: Supabase client factories, validation schemas, utility functions
- Location: `src/lib/`
- Contains: `supabase/server.ts`, `supabase/client.ts`, `supabase/middleware.ts`, `validations/`, `utils/`
- Depends on: `@supabase/ssr`, `zod`, `clsx`, `tailwind-merge`
- Used by: Pages, API routes, components

**API Routes Layer:**
- Purpose: Webhook/cron endpoints and one REST endpoint consumed externally
- Location: `src/app/api/`
- Contains: `auth/callback/route.ts`, `jobs/route.ts`, `cron/purge-deleted-jobs/route.ts`
- Depends on: Supabase server client, validation schemas
- Used by: Supabase OAuth callback, external cron trigger (Vercel), external clients if needed

**Types Layer:**
- Purpose: Shared TypeScript interfaces
- Location: `src/types/index.ts`
- Contains: `User`, `JobListing`, `Application`, `Profile`, `UserRole`
- Depends on: Nothing
- Used by: Components and pages throughout

## Data Flow

**Standard Page Data Fetch (Server Component):**
1. Page component calls `createClient()` from `src/lib/supabase/server.ts`
2. Calls `supabase.auth.getUser()` to get the current session
3. Queries the relevant Supabase tables directly (e.g., `job_listings`, `applications`)
4. Passes fetched data as props to Client Component children for rendering
5. Example: `src/app/(dashboard)/dashboard/page.tsx` → `JobSeekerDashboard` or `EmployerDashboard`

**Mutation Flow (Client Component):**
1. Client Component uses `createClient()` from `src/lib/supabase/client.ts` (browser client)
2. Calls Supabase JS SDK directly (e.g., `supabase.from('saved_jobs').insert(...)`)
3. Calls `router.refresh()` after mutation to trigger server re-render
4. Example: `src/components/jobs/SaveJobButton.tsx`, `src/components/jobs/ApplyButton.tsx`

**Auth Flow:**
1. User submits login form in `src/components/auth/LoginForm.tsx` (Client Component)
2. Calls `supabase.auth.signInWithPassword()` using browser client
3. On success, calls `router.push('/dashboard')` + `router.refresh()`
4. Middleware (`src/middleware.ts`) refreshes session cookies on every subsequent request via `updateSession()`
5. Protected paths: `/dashboard`, `/profile`, `/applications`, `/saved`, `/jobs/post`, `/messages`, `/recyclebin` — unauthenticated users are redirected to `/login`

**OAuth Callback Flow:**
1. Supabase redirects to `/api/auth/callback` with an auth `code`
2. `src/app/api/auth/callback/route.ts` exchanges code for session via `supabase.auth.exchangeCodeForSession()`
3. Redirects to `/dashboard` on success, `/login?error=auth-callback-failed` on failure

**Signup Flow:**
1. `src/components/auth/SignupForm.tsx` calls `supabase.auth.signUp()` with `full_name` and `role` in metadata
2. Supabase trigger `handle_new_user()` auto-creates a row in `public.profiles` with the user's name and role
3. User is redirected to `/dashboard`

## Key Abstractions

**Role-Based UI:**
- Purpose: Show different dashboards and sidebar nav items based on user role (`jobseeker` | `employer`)
- Examples: `src/app/(dashboard)/dashboard/page.tsx`, `src/components/layout/Sidebar.tsx`
- Pattern: Server page fetches `profile.role`, passes it as a prop to the client sidebar and renders the appropriate dashboard component

**Soft Delete (Recycle Bin):**
- Purpose: Jobs are soft-deleted via a `deleted_at` timestamp rather than hard deleted
- Examples: `src/app/(dashboard)/recyclebin/page.tsx`, `src/app/api/cron/purge-deleted-jobs/route.ts`
- Pattern: Queries filter with `.is('deleted_at', null)` for active listings; a weekly Vercel cron job permanently purges rows older than 7 days

**Supabase RLS (Row Level Security):**
- Purpose: Database-level access control — enforced on all tables
- Examples: `supabase/migrations/001_initial_schema.sql`, `003_messages.sql`
- Pattern: Policies lock reads/writes to the authenticated user's own data; employers can see applications for their own jobs; public can read active job listings

**Fresh Graduate Policy:**
- Purpose: Jobs can be tagged as open to fresh graduates or fresh grads with some experience
- Examples: `src/app/page.tsx`, `src/app/jobs/[id]/page.tsx`
- Pattern: `fresh_grad_policy` field on `job_listings` with values `fresh_grad` | `fresh_grad_plus`; rendered as color-coded badges

## Entry Points

**Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Applies global fonts, renders `<Navbar>` and `<Footer>` around all page content

**Dashboard Layout:**
- Location: `src/app/(dashboard)/layout.tsx`
- Triggers: Any route under `/(dashboard)/`
- Responsibilities: Verifies auth (redirects if unauthenticated), fetches user profile/role, renders `<Sidebar>` with role-aware nav

**Root Page (Homepage):**
- Location: `src/app/page.tsx`
- Triggers: GET `/`
- Responsibilities: Fetches 5 most recent active job listings, checks saved status for logged-in users, renders hero + categories + recent listings

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: Every non-static request
- Responsibilities: Refreshes Supabase session cookies; redirects unauthenticated users away from protected paths

## Error Handling

**Strategy:** Inline, component-level — no global error boundary pattern

**Patterns:**
- Server pages use `notFound()` from `next/navigation` for missing or unauthorized resources (e.g., `src/app/jobs/[id]/page.tsx`)
- Server pages use `redirect('/login')` for unauthenticated access as a secondary guard after middleware
- API routes return `NextResponse.json({ error: ... }, { status: N })` for all error cases
- Client components use local `useState` error strings displayed inline in forms
- Supabase errors are checked via the `error` property returned from every SDK call

## Cross-Cutting Concerns

**Logging:** None — no logging library; errors are surfaced to the user only
**Validation:** Zod schemas in `src/lib/validations/` — `jobSchema` used in `POST /api/jobs`, `loginSchema`/`signupSchema` defined but not consumed via the API route (auth forms call Supabase SDK directly)
**Authentication:** Supabase Auth — session managed via cookies using `@supabase/ssr`; two-layer enforcement (middleware + layout/page redirect)

---

*Architecture analysis: 2026-04-12*
