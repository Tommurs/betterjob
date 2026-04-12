# Technology Stack

**Analysis Date:** 2026-04-12

## Languages

**Primary:**
- TypeScript 5.x - All application source code (`src/`)
- SQL - Supabase database migrations (`supabase/migrations/`)

**Secondary:**
- CSS (via Tailwind) - Styling, global styles in `src/app/globals.css`

## Runtime

**Environment:**
- Node.js 20 (Alpine) — specified in `Dockerfile` base image (`node:20-alpine`)
- Local dev runtime: Node.js v24.14.1 (host machine)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (lockfile version 3)

## Frameworks

**Core:**
- Next.js 14.2.35 — App Router, React Server Components, API routes, middleware
- React 18.x — UI rendering

**Build/Dev:**
- TypeScript compiler (via Next.js build pipeline) — `tsconfig.json`
- PostCSS 8.x — CSS processing (`postcss.config.mjs`)
- Tailwind CSS 3.4.1 — Utility-first styling (`tailwind.config.ts`)
- ESLint 8.x — Linting via `eslint-config-next` 14.2.35

**No dedicated test runner detected** (tests directory exists at `tests/` with `e2e/`, `integration/`, `unit/` subdirs but no test framework config found at root)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.101.1 — Supabase client SDK for DB, Auth, Realtime
- `@supabase/ssr` ^0.10.0 — Supabase SSR helpers for Next.js (cookie-based session management)
- `zod` ^4.3.6 — Runtime schema validation for API request bodies

**Utility:**
- `clsx` ^2.1.1 — Conditional className construction
- `tailwind-merge` ^3.5.0 — Merges Tailwind class strings, resolving conflicts

## Scripts

Defined in `package.json`:
```bash
npm run dev      # next dev — local development server
npm run build    # next build — production build
npm start        # next start — production server
npm run lint     # next lint — ESLint check
```

## Configuration

**Path Aliases:**
- `@/*` maps to `./src/*` — defined in `tsconfig.json`

**TypeScript:**
- Strict mode enabled (`"strict": true`)
- Module resolution: `bundler`
- Target: ESNext

**Tailwind:**
- Content paths: `src/pages/**`, `src/components/**`, `src/app/**`
- Custom CSS variables for `background` and `foreground` colors
- Config: `tailwind.config.ts`

**Next.js:**
- Config: `next.config.mjs` — minimal, no custom config
- App Router only (no `pages/` directory)

## Platform Requirements

**Development:**
- Node.js 20+ (Docker) or Node.js 24.x (host)
- Docker + Docker Compose for containerized dev: `docker-compose.yml`
- `.env.local` required with Supabase credentials

**Production:**
- Deployment target: Vercel (see `vercel.json`)
- Docker production build available via `Dockerfile` (multi-stage: development → builder → production)
- Vercel Cron Jobs configured in `vercel.json`

---

*Stack analysis: 2026-04-12*
