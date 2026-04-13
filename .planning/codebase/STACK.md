# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript ^5 - All application source code in `src/`; strict mode enabled

**Secondary:**
- SQL - Supabase database migrations in `supabase/migrations/`

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Specified as base image in `Dockerfile`

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfile version 3)

## Frameworks

**Core:**
- Next.js 14.2.35 - App Router exclusively; React Server Components; API routes; Edge middleware

**UI:**
- React ^18 - Component rendering (`react`, `react-dom`)
- Tailwind CSS ^3.4.1 - Utility-first CSS; config at `tailwind.config.ts`

**Validation:**
- Zod ^4.3.6 - Runtime schema validation; schemas in `src/lib/validations/auth.ts` and `src/lib/validations/job.ts`

**Build/Dev:**
- PostCSS ^8 - CSS processing; config at `postcss.config.mjs`
- ESLint ^8 with `eslint-config-next` 14.2.35 - Linting

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.101.1 - Core Supabase client; used for DB queries, auth, and realtime
- `@supabase/ssr` ^0.10.0 - Supabase SSR helpers (`createBrowserClient`, `createServerClient`) for cookie-based sessions in Next.js

**Utilities:**
- `clsx` ^2.1.1 - Conditional className construction
- `tailwind-merge` ^3.5.0 - Tailwind class conflict resolution (used together with `clsx` in `src/lib/utils/index.ts`)

## Scripts

Defined in `package.json`:
```bash
npm run dev      # next dev — local development server
npm run build    # next build — production build
npm start        # next start — production server
npm run lint     # next lint — ESLint check
```

## Configuration

**TypeScript:**
- Path alias: `@/*` → `./src/*` - defined in `tsconfig.json`
- Strict mode: enabled (`"strict": true`)
- Module resolution: `bundler`
- JSX: `preserve` (handled by Next.js)

**Tailwind:**
- Content scan paths: `src/pages/**`, `src/components/**`, `src/app/**`
- Custom CSS variables: `background`, `foreground` colors extended in theme
- Config: `tailwind.config.ts`

**Next.js:**
- Config: `next.config.mjs` - minimal, no custom configuration
- App Router only; no `pages/` directory

**Build:**
- No test runner config at root; `tests/` directory has `unit/`, `integration/`, `e2e/` subdirectories but no framework config detected

## Platform Requirements

**Development:**
- Node.js 20
- Docker + Docker Compose for containerized dev: `docker-compose.yml` (hot-reload via `WATCHPACK_POLLING=true`)
- `.env.local` required with Supabase credentials

**Production:**
- Primary deployment target: **Vercel** (`vercel.json` present; Vercel Cron configured)
- Docker production image available via multi-stage `Dockerfile` (development → builder → production targets, all Node 20 Alpine)

---

*Stack analysis: 2026-04-12*
