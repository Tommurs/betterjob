# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
BetterJob/
├── src/
│   ├── app/                              # Next.js App Router — all pages, layouts, API routes
│   │   ├── (auth)/                       # Route group: auth pages (no layout wrapper, no URL segment)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/
│   │   │       ├── page.tsx
│   │   │       └── update/page.tsx
│   │   ├── (dashboard)/                  # Route group: protected pages with Sidebar layout
│   │   │   ├── layout.tsx                # Auth guard + role fetch + Sidebar render
│   │   │   ├── applications/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── recyclebin/page.tsx
│   │   │   └── saved/page.tsx
│   │   ├── api/                          # API route handlers (route.ts files only)
│   │   │   ├── auth/callback/route.ts    # OAuth/magic-link callback
│   │   │   ├── jobs/route.ts             # GET + POST /api/jobs
│   │   │   └── cron/purge-deleted-jobs/route.ts
│   │   ├── jobs/                         # Public job pages (no auth required for reads)
│   │   │   ├── page.tsx                  # Job listing / search
│   │   │   ├── post/page.tsx             # Post a job (employer only)
│   │   │   └── [id]/
│   │   │       ├── page.tsx              # Job detail
│   │   │       ├── edit/page.tsx         # Edit listing
│   │   │       └── applications/page.tsx # Employer: view applicants
│   │   ├── messages/
│   │   │   ├── page.tsx                  # Conversation list
│   │   │   └── [id]/page.tsx             # Message thread
│   │   ├── fonts/                        # Local font files (GeistVF.woff, GeistMonoVF.woff)
│   │   ├── globals.css                   # Tailwind base styles
│   │   ├── layout.tsx                    # Root layout — Navbar + Footer wrapper
│   │   └── page.tsx                      # Homepage (hero, categories, recent listings)
│   ├── components/                       # All React components, grouped by feature domain
│   │   ├── auth/                         # Auth forms
│   │   ├── dashboard/                    # Dashboard view components
│   │   ├── forms/                        # Shared form primitives (directory exists, currently empty)
│   │   ├── jobs/                         # Job-related components
│   │   ├── layout/                       # Shell components (Navbar, Sidebar, Footer)
│   │   ├── messages/                     # Messaging components
│   │   ├── profile/                      # Profile components
│   │   └── ui/                           # Generic reusable UI primitives
│   ├── hooks/
│   │   ├── useSupabase.ts                # Returns memoized browser Supabase client
│   │   └── useUser.ts                    # Reactive auth state via onAuthStateChange
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client factory (createBrowserClient)
│   │   │   ├── server.ts                 # Server client factory (createServerClient + cookies)
│   │   │   └── middleware.ts             # updateSession() — cookie refresh + route guard logic
│   │   ├── utils/
│   │   │   └── index.ts                  # cn(), formatSalary(), formatDate(), slugify()
│   │   └── validations/
│   │       ├── auth.ts                   # loginSchema, signupSchema, resetPasswordSchema (Zod)
│   │       └── job.ts                    # jobSchema (Zod)
│   ├── middleware.ts                     # Next.js middleware entry — delegates to lib/supabase/middleware.ts
│   ├── styles/                           # Additional global styles (directory present, currently unused)
│   └── types/
│       └── index.ts                      # Shared interfaces: User, JobListing, Application, Profile, UserRole
├── supabase/
│   ├── migrations/                       # Sequential SQL migration files (hand-authored)
│   └── seed/                             # Seed data scripts
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── unit/
├── docs/                                 # Project documentation
├── .planning/codebase/                   # Codebase analysis documents (this file)
├── docker-compose.yml                    # Local Supabase stack
├── Dockerfile
├── next.config.mjs                       # Minimal Next.js config (no customizations)
├── tailwind.config.ts
├── tsconfig.json                         # @/ alias maps to ./src/
└── vercel.json                           # Vercel cron schedule (weekly purge job)
```

## Directory Purposes

**`src/app/(auth)/`:**
- Purpose: Login, signup, and password reset pages
- Contains: Thin server page shells that render Client Component forms
- Key files: `login/page.tsx`, `signup/page.tsx`, `reset-password/page.tsx`, `reset-password/update/page.tsx`
- Note: Route group — URLs are `/login`, `/signup`, `/reset-password` (no `(auth)` prefix in URL)

**`src/app/(dashboard)/`:**
- Purpose: All authenticated user pages sharing the Sidebar layout
- Contains: `layout.tsx` with auth guard + role resolution; pages for dashboard, applications, profile, saved jobs, recycle bin
- Key files: `layout.tsx` (critical — performs auth check, fetches profile, renders Sidebar), `dashboard/page.tsx`
- Note: Route group — URLs are `/dashboard`, `/applications`, `/profile`, etc.

**`src/app/jobs/`:**
- Purpose: Public job browsing plus employer job management (outside the dashboard group)
- Contains: Listing/search page, detail page, post page, edit page, applicant review page
- Key files: `page.tsx` (search + filter), `[id]/page.tsx` (detail with owner/applicant branching), `post/page.tsx`, `[id]/edit/page.tsx`, `[id]/applications/page.tsx`

**`src/app/messages/`:**
- Purpose: Messaging between employers and applicants (outside the dashboard group)
- Contains: Conversation list, individual message thread
- Key files: `page.tsx`, `[id]/page.tsx`

**`src/app/api/`:**
- Purpose: API route handlers — OAuth callback, REST endpoint, background cron
- Contains: Only `route.ts` files; no page-level files
- Key files: `auth/callback/route.ts`, `jobs/route.ts`, `cron/purge-deleted-jobs/route.ts`

**`src/components/auth/`:**
- Purpose: All authentication form components (all `'use client'`)
- Key files: `LoginForm.tsx`, `SignupForm.tsx`, `ResetPasswordForm.tsx`, `UpdatePasswordForm.tsx`

**`src/components/dashboard/`:**
- Purpose: Role-specific dashboard views rendered by `dashboard/page.tsx`
- Key files: `JobSeekerDashboard.tsx`, `EmployerDashboard.tsx`, `RecycleBin.tsx`

**`src/components/jobs/`:**
- Purpose: All job-related interactive components (most are `'use client'`)
- Key files: `PostJobForm.tsx`, `EditJobForm.tsx`, `ApplyButton.tsx`, `SaveJobButton.tsx`, `UnsaveButton.tsx`, `SearchBar.tsx`, `StatusUpdater.tsx`, `EmployerJobActions.tsx`

**`src/components/layout/`:**
- Purpose: Shell components that appear on every or most pages
- Key files: `Navbar.tsx` (async Server Component — fetches user), `NavbarUserMenu.tsx` (Client Component dropdown), `Sidebar.tsx` (Client Component — role-based nav + sign out), `Footer.tsx`

**`src/components/messages/`:**
- Purpose: Messaging UI components
- Key files: `MessageThread.tsx`, `StartConversationButton.tsx`

**`src/lib/supabase/`:**
- Purpose: Supabase client instantiation — three separate entry points for three execution contexts
- `client.ts` — use in Client Components (browser)
- `server.ts` — use in Server Components and Route Handlers
- `middleware.ts` — use only in `src/middleware.ts`

**`src/lib/validations/`:**
- Purpose: Zod schemas for form and API input validation
- Key files: `auth.ts` (exports `loginSchema`, `signupSchema`, `resetPasswordSchema`), `job.ts` (exports `jobSchema`, `JobFormData`)

**`src/lib/utils/index.ts`:**
- Purpose: Shared pure utility functions
- Exports: `cn()` (Tailwind class merging via clsx + tailwind-merge), `formatSalary(min, max)`, `formatDate(isoString)`, `slugify(text)`

**`src/types/index.ts`:**
- Purpose: Single barrel file for all shared TypeScript types
- Exports: `UserRole`, `User`, `JobListing`, `Application`, `Profile`

**`supabase/migrations/`:**
- Purpose: Versioned SQL files applied to the Supabase database in numeric order
- Pattern: `00N_description.sql` (e.g., `001_initial_schema.sql`, `007_fresh_grad.sql`)
- Generated: No — hand-authored
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — Root HTML shell, global fonts (Geist), Navbar + Footer
- `src/app/page.tsx` — Homepage: hero, category browse, 5 most recent listings
- `src/middleware.ts` — Request interceptor: session refresh + route protection
- `src/app/(dashboard)/layout.tsx` — Dashboard shell: auth guard, role resolution, Sidebar

**Configuration:**
- `tsconfig.json` — TypeScript config; `@/` alias maps to `./src/`
- `tailwind.config.ts` — Tailwind configuration
- `vercel.json` — Cron schedule: `0 0 * * 0` (weekly) for `purge-deleted-jobs`
- `docker-compose.yml` — Local Supabase instance for development
- `next.config.mjs` — Minimal; no custom Next.js configuration

**Core Business Logic:**
- `src/lib/supabase/middleware.ts` — Protected path list; session refresh and redirect logic
- `src/app/(dashboard)/dashboard/page.tsx` — Role branch: renders `JobSeekerDashboard` or `EmployerDashboard`
- `src/app/jobs/[id]/page.tsx` — Owner vs applicant branching; soft-delete visibility logic
- `src/app/api/cron/purge-deleted-jobs/route.ts` — Hard-deletes soft-deleted jobs older than 7 days

**Database Schema:**
- `supabase/migrations/001_initial_schema.sql` — Core tables: `profiles`, `job_listings`, `applications`, RLS policies, `handle_new_user` trigger
- `supabase/migrations/002_saved_jobs.sql` — `saved_jobs` table
- `supabase/migrations/003_messages.sql` — `conversations`, `messages` tables
- `supabase/migrations/004_recycle_bin.sql` — `deleted_at` column on `job_listings`

## Naming Conventions

**Files:**
- Next.js reserved files: `page.tsx`, `layout.tsx`, `route.ts` (always lowercase)
- Components: PascalCase `.tsx` — e.g., `LoginForm.tsx`, `SaveJobButton.tsx`, `NavbarUserMenu.tsx`
- Hooks: camelCase prefixed with `use` — e.g., `useUser.ts`, `useSupabase.ts`
- Lib modules: camelCase — e.g., `client.ts`, `server.ts`, `middleware.ts`
- Validation files: singular noun — e.g., `job.ts`, `auth.ts`
- Type files: singular — `index.ts` barrel

**Directories:**
- App route segments: lowercase, hyphens for multi-word — e.g., `reset-password/`, `purge-deleted-jobs/`
- Route groups: lowercase with parentheses — `(auth)/`, `(dashboard)/`
- Component folders: lowercase, feature-named — e.g., `jobs/`, `dashboard/`, `layout/`
- Dynamic segments: bracket notation — `[id]/`

**Database:**
- Tables: `snake_case` plural — e.g., `job_listings`, `saved_jobs`, `conversations`
- Columns: `snake_case`
- Enum-like string values: `snake_case` — e.g., `full_time`, `fresh_grad_plus`, `jobseeker`

## Where to Add New Code

**New authenticated page:**
- Create `src/app/(dashboard)/[feature]/page.tsx`
- The `(dashboard)/layout.tsx` automatically wraps it with auth + Sidebar
- Add a nav item to `JOBSEEKER_NAV` or `EMPLOYER_NAV` in `src/components/layout/Sidebar.tsx`
- Verify the path is covered by the protected paths list in `src/lib/supabase/middleware.ts`

**New public page:**
- Create `src/app/[feature]/page.tsx`
- No auth wrapper; page is publicly accessible by default

**New API route:**
- Create `src/app/api/[feature]/route.ts`
- Import server client from `src/lib/supabase/server.ts`
- Return `NextResponse.json()` for all responses; check auth via `supabase.auth.getUser()`

**New component:**
- Place in `src/components/[feature]/ComponentName.tsx`
- Add `'use client'` only if the component uses `useState`, `useEffect`, event handlers, or browser APIs
- Server Components: call `createClient()` from `src/lib/supabase/server.ts` directly
- Client Components: import `createClient` from `src/lib/supabase/client.ts` or use `useSupabase()` hook

**New validation schema:**
- Add to `src/lib/validations/[feature].ts`
- Export both the schema and its inferred type: `export type XFormData = z.infer<typeof xSchema>`

**New shared type:**
- Add interface or type to `src/types/index.ts`

**New utility function:**
- Add to `src/lib/utils/index.ts` as a named export

**New database table:**
- Create `supabase/migrations/00N_description.sql` (increment N)
- Include RLS policies in the same migration file
- Add corresponding TypeScript interface to `src/types/index.ts`

## Special Directories

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents consumed by planning and execution agents
- Generated: No — produced by mapping agents
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and dev server cache
- Generated: Yes — by `next build` / `next dev`
- Committed: No

**`node_modules/`:**
- Purpose: npm package dependencies
- Generated: Yes — by `npm install`
- Committed: No

**`supabase/migrations/`:**
- Purpose: Ordered SQL migration files applied to the database
- Generated: No — hand-authored
- Committed: Yes

---

*Structure analysis: 2026-04-12*
