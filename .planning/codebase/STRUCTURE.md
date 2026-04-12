# Codebase Structure

**Analysis Date:** 2026-04-12

## Directory Layout

```
BetterJob/
├── src/
│   ├── app/                        # Next.js App Router — pages, layouts, API routes
│   │   ├── (auth)/                 # Auth route group (no layout wrapper, no URL segment)
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── reset-password/
│   │   │       ├── page.tsx
│   │   │       └── update/page.tsx
│   │   ├── (dashboard)/            # Protected route group with Sidebar layout
│   │   │   ├── layout.tsx          # Auth guard + role fetch + Sidebar render
│   │   │   ├── applications/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── recyclebin/page.tsx
│   │   │   └── saved/page.tsx
│   │   ├── api/                    # API route handlers
│   │   │   ├── auth/callback/route.ts    # OAuth callback
│   │   │   ├── jobs/route.ts             # GET + POST /api/jobs
│   │   │   └── cron/purge-deleted-jobs/route.ts
│   │   ├── jobs/                   # Public job pages
│   │   │   ├── page.tsx            # Job listings / search
│   │   │   ├── post/page.tsx       # Post a job (employer only)
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Job detail
│   │   │       ├── edit/page.tsx   # Edit listing
│   │   │       └── applications/page.tsx  # View applicants
│   │   ├── messages/
│   │   │   ├── page.tsx            # Conversation list
│   │   │   └── [id]/page.tsx       # Message thread
│   │   ├── fonts/                  # Local font files (GeistVF, GeistMonoVF)
│   │   ├── globals.css             # Tailwind base styles
│   │   ├── layout.tsx              # Root layout (Navbar + Footer)
│   │   └── page.tsx                # Homepage
│   ├── components/                 # UI components
│   │   ├── auth/                   # Auth forms (LoginForm, SignupForm, etc.)
│   │   ├── dashboard/              # Dashboard views (JobSeekerDashboard, EmployerDashboard, RecycleBin)
│   │   ├── forms/                  # Shared form primitives (if any)
│   │   ├── jobs/                   # Job-related components (PostJobForm, EditJobForm, ApplyButton, SaveJobButton, SearchBar, etc.)
│   │   ├── layout/                 # Shell components (Navbar, NavbarUserMenu, Sidebar, Footer)
│   │   ├── messages/               # Messaging components (MessageThread, StartConversationButton)
│   │   ├── profile/                # Profile components (ProfileForm)
│   │   └── ui/                     # Generic/reusable UI primitives
│   ├── hooks/
│   │   ├── useSupabase.ts          # Returns memoized browser Supabase client
│   │   └── useUser.ts              # Subscribes to Supabase auth state changes
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client factory (createBrowserClient)
│   │   │   ├── server.ts           # Server client factory (createServerClient + cookies)
│   │   │   └── middleware.ts       # updateSession() — cookie refresh + route guard
│   │   ├── utils/
│   │   │   └── index.ts            # cn(), formatSalary(), formatDate(), slugify()
│   │   └── validations/
│   │       ├── auth.ts             # loginSchema, signupSchema, resetPasswordSchema (Zod)
│   │       └── job.ts              # jobSchema (Zod)
│   ├── middleware.ts               # Next.js middleware entry — delegates to lib/supabase/middleware.ts
│   ├── styles/                     # Additional global styles (if any)
│   └── types/
│       └── index.ts                # Shared interfaces: User, JobListing, Application, Profile, UserRole
├── supabase/
│   ├── migrations/                 # Sequential SQL migration files
│   │   ├── 001_initial_schema.sql  # profiles, job_listings, applications, RLS, triggers
│   │   ├── 002_saved_jobs.sql
│   │   ├── 003_messages.sql        # conversations, messages, RLS
│   │   ├── 004_recycle_bin.sql     # deleted_at column on job_listings
│   │   ├── 005_job_type_and_experience.sql
│   │   ├── 006_qualifications.sql
│   │   └── 007_fresh_grad.sql
│   └── seed/                       # Seed data scripts
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── unit/
├── docs/                           # Project documentation
├── docker-compose.yml              # Local Supabase stack
├── Dockerfile
├── next.config.mjs                 # Minimal Next.js config (no customizations)
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json                     # Vercel cron schedule (weekly purge job)
```

## Directory Purposes

**`src/app/(auth)/`:**
- Purpose: Login, signup, and password reset pages
- Contains: Server page shells that render Client Component forms
- Key files: `login/page.tsx`, `signup/page.tsx`, `reset-password/page.tsx`
- Note: Route group — these URLs are `/login`, `/signup`, `/reset-password` (no `(auth)` in path)

**`src/app/(dashboard)/`:**
- Purpose: All authenticated user pages with shared Sidebar layout
- Contains: Layout with auth guard + role resolution, and pages for applications, profile, saved jobs, recycle bin
- Key files: `layout.tsx` (critical — fetches role, renders Sidebar), `dashboard/page.tsx`
- Note: Route group — URLs are `/dashboard`, `/applications`, etc. (no `(dashboard)` in path)

**`src/app/jobs/`:**
- Purpose: Public job browsing, job detail, and employer job management
- Contains: Listing search page, detail page, post/edit pages, applicant review
- Key files: `page.tsx` (search), `[id]/page.tsx` (detail), `post/page.tsx`, `[id]/edit/page.tsx`

**`src/app/api/`:**
- Purpose: API route handlers for OAuth callback, REST endpoint, and cron
- Contains: Only `route.ts` files — no subdirectory index files
- Key files: `auth/callback/route.ts`, `jobs/route.ts`, `cron/purge-deleted-jobs/route.ts`

**`src/components/`:**
- Purpose: All React components, grouped by feature domain
- Pattern: Feature folder (e.g., `jobs/`) contains related components; `layout/` contains shell components; `ui/` for generics
- Key files: `layout/Navbar.tsx`, `layout/Sidebar.tsx`, `jobs/PostJobForm.tsx`, `auth/LoginForm.tsx`

**`src/lib/supabase/`:**
- Purpose: Supabase client instantiation — three separate entry points for three contexts
- `client.ts` — browser/client components
- `server.ts` — server components and API routes
- `middleware.ts` — Next.js middleware only

**`src/lib/validations/`:**
- Purpose: Zod schemas for form and API input validation
- Key files: `auth.ts` (login/signup/reset schemas), `job.ts` (job posting schema)

**`src/lib/utils/index.ts`:**
- Purpose: Shared pure utility functions
- Exports: `cn()` (Tailwind class merging), `formatSalary()`, `formatDate()`, `slugify()`

**`src/types/index.ts`:**
- Purpose: Single file for all shared TypeScript types
- Exports: `User`, `JobListing`, `Application`, `Profile`, `UserRole`

**`supabase/migrations/`:**
- Purpose: Versioned SQL files applied to the Supabase database in order
- Generated: No — hand-authored
- Committed: Yes

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML shell, global fonts, Navbar + Footer
- `src/app/page.tsx`: Homepage — hero, categories, recent listings
- `src/middleware.ts`: Request interceptor — session refresh + route protection

**Configuration:**
- `tsconfig.json`: TypeScript config — `@/` alias maps to `./src/`
- `tailwind.config.ts`: Tailwind config
- `vercel.json`: Cron schedule for `purge-deleted-jobs`
- `docker-compose.yml`: Local Supabase instance

**Core Logic:**
- `src/lib/supabase/middleware.ts`: Protected path list and redirect logic
- `src/app/(dashboard)/layout.tsx`: Role resolution for the entire dashboard section
- `src/app/(dashboard)/dashboard/page.tsx`: Role-branching dashboard — renders different component trees for jobseekers vs employers

**Database:**
- `supabase/migrations/001_initial_schema.sql`: Canonical schema for all core tables and RLS policies

## Naming Conventions

**Files:**
- Pages: `page.tsx` (all lowercase, required by Next.js App Router)
- Layouts: `layout.tsx`
- API routes: `route.ts`
- Components: PascalCase `.tsx` (e.g., `LoginForm.tsx`, `SaveJobButton.tsx`)
- Hooks: camelCase prefixed with `use` (e.g., `useUser.ts`, `useSupabase.ts`)
- Lib modules: camelCase (e.g., `client.ts`, `server.ts`)
- Validation schemas: camelCase noun (e.g., `job.ts`, `auth.ts`)

**Directories:**
- App route segments: lowercase with hyphens (e.g., `reset-password/`, `purge-deleted-jobs/`)
- Route groups: lowercase with parentheses (e.g., `(auth)/`, `(dashboard)/`)
- Component folders: lowercase, feature-named (e.g., `jobs/`, `dashboard/`, `layout/`)
- Dynamic segments: bracket notation (e.g., `[id]/`)

**Database:**
- Tables: `snake_case` plural (e.g., `job_listings`, `saved_jobs`, `conversations`)
- Columns: `snake_case`
- Enum values: `snake_case` strings (e.g., `full_time`, `fresh_grad_plus`)

## Where to Add New Code

**New Page (authenticated):**
- Add `page.tsx` under `src/app/(dashboard)/[feature]/`
- The `(dashboard)/layout.tsx` automatically wraps it with auth + Sidebar
- Add corresponding nav item to `JOBSEEKER_NAV` or `EMPLOYER_NAV` in `src/components/layout/Sidebar.tsx`
- Add path to the protected paths list in `src/lib/supabase/middleware.ts` if not already covered

**New Page (public):**
- Add `page.tsx` under `src/app/[feature]/`
- No auth wrapper — page is publicly accessible

**New API Route:**
- Add `route.ts` under `src/app/api/[feature]/`
- Import server client from `src/lib/supabase/server.ts`
- Return `NextResponse.json()` for all responses

**New Component:**
- Place in the matching feature folder under `src/components/[feature]/`
- Use `'use client'` directive only if the component uses hooks, event handlers, or browser APIs
- Server Components (no directive): fetch data directly via `createClient()` from `src/lib/supabase/server.ts`
- Client Components: use `useSupabase()` hook or `createClient()` from `src/lib/supabase/client.ts`

**New Validation Schema:**
- Add to `src/lib/validations/[feature].ts`
- Export the schema and infer the type with `z.infer<typeof schema>`

**New Shared Type:**
- Add to `src/types/index.ts`

**New Utility Function:**
- Add to `src/lib/utils/index.ts`

**New Database Table:**
- Create `supabase/migrations/00N_description.sql`
- Include RLS policies in the same file
- Add corresponding TypeScript interface to `src/types/index.ts`

## Special Directories

**`.planning/`:**
- Purpose: Planning and analysis documents for the project
- Generated: No — hand-authored by planning agents
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output and dev cache
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
