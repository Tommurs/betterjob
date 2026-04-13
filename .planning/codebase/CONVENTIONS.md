# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- React components: PascalCase matching the exported component name — `LoginForm.tsx`, `PostJobForm.tsx`, `NavbarUserMenu.tsx`
- Hooks: camelCase with `use` prefix — `useUser.ts`, `useSupabase.ts`
- Utility modules: camelCase — `index.ts` inside named directories (`lib/utils/`, `lib/validations/`)
- Next.js route files: lowercase — `page.tsx`, `layout.tsx`, `route.ts`
- Directories: camelCase — `src/components/auth/`, `src/lib/supabase/`, `src/hooks/`

**Functions:**
- Event handlers: `handle` prefix — `handleSubmit`, `handleApplyClick`, `handleDelete`, `handleKeyDown`
- Action functions: verb-first camelCase — `addRequirement`, `removeRequirement`, `addSkill`, `formatSalary`, `formatDate`
- Components: PascalCase default export — `export default function LoginForm()`
- Hooks: camelCase named export — `export function useUser()`

**Variables:**
- camelCase throughout — `salaryMin`, `experienceMax`, `freshGradPolicy`, `coverLetter`
- Boolean flags: plain names in React state (`loading`, `applied`, `saved`); `is_` prefix in Supabase DB columns
- Supabase client: always named `supabase` — `const supabase = createClient()`

**Types/Interfaces:**
- Inline `Props` interface per file: `interface Props { ... }` — not exported, not prefixed with `I`
- Domain types in `src/types/index.ts` — `interface User`, `interface JobListing`, `interface Application`, `interface Profile`
- Zod-inferred types exported alongside schema — `export type JobFormData = z.infer<typeof jobSchema>`
- String union literal types preferred over enums — `type UserRole = 'jobseeker' | 'employer' | 'admin'`

**Constants:**
- Module-level option arrays and lookup maps: SCREAMING_SNAKE_CASE — `JOB_TYPES`, `EXPERIENCE_OPTIONS`, `DEGREE_OPTIONS`, `JOB_TYPE_COLOURS`, `FRESH_GRAD_BADGE`
- Typed as `Record<string, string>` or `{ value: string; label: string }[]`

## TypeScript Patterns

**Strict mode** is enabled (`"strict": true` in `tsconfig.json`). No `any` usage observed.

**Component props** are typed with a local `interface Props` in the same file:
```typescript
interface Props {
  jobId: string
  isSaved: boolean
  isLoggedIn: boolean
}
export default function SaveJobButton({ jobId, isSaved, isLoggedIn }: Props) { ... }
```

**Server components** receive typed params/searchParams:
```typescript
export default async function JobDetailPage({ params }: { params: { id: string } }) { ... }
export default async function JobsPage({ searchParams }: { searchParams: { q?: string; location?: string; type?: string } }) { ... }
```

**Optional chaining** used consistently for nullable DB results:
```typescript
const role = profile?.role ?? 'jobseeker'
job.salary_min?.toString() ?? ''
```

**Type assertions** used sparingly; `as const` used for literal union narrowing in inline maps:
```typescript
const [freshGradPolicy, setFreshGradPolicy] = useState<'no' | 'fresh_grad' | 'fresh_grad_plus'>('no')
({ value: 'no', label: 'No' } as const)
```

**Path alias:** `@/*` maps to `./src/*`. Use for all imports from `src/`.

## Code Style

**Formatting:**
- No Prettier config present — style enforced by ESLint and editor defaults
- Indentation: 2 spaces
- Quotes: single quotes in `.ts`/`.tsx` files
- Semicolons: omitted (no-semicolon style throughout)
- Trailing commas: present in multi-line objects/arrays

**Linting:**
- Config: `.eslintrc.json` — extends `next/core-web-vitals` and `next/typescript`
- No custom rule overrides
- Run via: `npm run lint`

## Component Structure Pattern

**Client components** always declare `'use client'` as the very first line, before any imports:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
```

**Server components** (pages, layouts, Navbar) are async functions with no directive, calling `createClient()` from `@/lib/supabase/server`.

**Typical client component structure order:**
1. `'use client'` directive
2. Imports
3. Module-level constants (option arrays, colour maps)
4. Local `interface Props`
5. Default export function
6. All `useState` declarations at the top of the function
7. Derived validation values (inline IIFEs)
8. `canSubmit` boolean
9. Helper functions (`add*`, `remove*`, `handleKeyDown`)
10. `async handleSubmit`
11. Local CSS class string variables
12. Optional locally-scoped sub-components
13. Return JSX

**Sub-components defined inside parent:** Used in `src/components/jobs/PostJobForm.tsx` and `src/components/jobs/EditJobForm.tsx` where `QualList` is defined as a function inside the parent component body. Use only for purely presentational, non-stateful children tightly coupled to the parent.

**Auth gates in server components** use `redirect()` / `notFound()` from `next/navigation`:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
if (!job) notFound()
```

## State Management Approach

No global state library (no Zustand, Redux, Context API). State is entirely local via `useState`.

Pattern: server components fetch data and pass it as props; client components accept initial data as props and maintain local state for optimistic updates, then call `router.refresh()` to re-sync server state:
```typescript
// Server page fetches and passes down
<EmployerDashboard activeJobs={activeJobs} archivedJobs={archivedJobs} />

// Client component mirrors with local state
const [activeJobs, setActiveJobs] = useState(initialActive)
```

Auth state in client components accessed via `useUser()` hook at `src/hooks/useUser.ts`, which subscribes to `supabase.auth.onAuthStateChange`.

## Form Handling Patterns

No form library. All forms use the same manual pattern:

1. Individual `useState` per field
2. `async function handleSubmit(e: React.FormEvent)` with `e.preventDefault()`
3. Inline derived validation via IIFEs:
```typescript
const salaryError = (() => {
  if (!salaryMin && !salaryMax) return ''
  if (Number(salaryMin) > Number(salaryMax))
    return `Minimum cannot exceed maximum.`
  return ''
})()
```
4. A `canSubmit` boolean that gates the submit button:
```typescript
const canSubmit = !loading && title.trim() !== '' && !salaryError && requirements.length > 0
```
5. `loading` state toggled around async Supabase calls
6. Errors displayed in a red inline banner:
```tsx
{error && (
  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
    {error}
  </p>
)}
```
7. Submit button uses `disabled={!canSubmit}` or `disabled={loading}`

Zod schemas in `src/lib/validations/` are used server-side only (in `src/app/api/jobs/route.ts`). Client forms use manual validation, not Zod.

## Tailwind CSS Usage

**Approach:** Utility-first with no component library. All styling via Tailwind classes directly on elements.

**Repeated class strings** are extracted to local constants when reused within the same file:
```typescript
const inputClass    = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
const inputErrClass = 'w-full px-4 py-2.5 border border-red-400 bg-red-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
const selectClass   = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
```

**`cn()` utility** is available at `src/lib/utils/index.ts` (combines `clsx` + `tailwind-merge`) but is not yet used in any component. Conditional classes are composed with template literals:
```typescript
className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
  type === t.value
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
}`}
```
Use `cn()` for new conditional class composition — it handles merge conflicts correctly.

**Core design tokens (use these for consistency):**
- Primary action: `bg-blue-600 hover:bg-blue-700 text-white`
- Destructive: `border-red-200 text-red-500 hover:bg-red-50`
- Secondary/teal accent (fresh grad feature): `bg-teal-600 text-white border-teal-600`
- Neutral card: `bg-white border border-gray-200 rounded-xl`
- Input field: `px-4 py-2.5 border border-gray-300 rounded-lg text-sm`
- Focus ring: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Error state: `border-red-400 bg-red-50`
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed`

**Responsive:** `sm:` breakpoint used throughout for grid/layout switches. `lg:` used for three-column layouts (`lg:grid-cols-3`).

**Custom CSS variables** `--background` and `--foreground` are extended as Tailwind colour tokens in `tailwind.config.ts`. Font variables `--font-geist-sans` / `--font-geist-mono` applied in `src/app/layout.tsx`.

## Import Organization

**Order convention (observed pattern):**
1. React hooks — `import { useState } from 'react'`
2. Next.js — `import Link from 'next/link'`, `import { useRouter } from 'next/navigation'`
3. Supabase client — `import { createClient } from '@/lib/supabase/client'`
4. Local components — `import ApplyButton from '@/components/jobs/ApplyButton'`
5. Local types and utils — `import { formatSalary } from '@/lib/utils'`

Use `@/` alias for all imports from within `src/`. Never use relative `../../` paths across feature directories.

## Error Handling

**Client-side:** Supabase errors are captured in a local `error` state string, rendered as a red inline banner inside the form.

**Server-side API routes** (`src/app/api/`): Return `NextResponse.json({ error: error.message }, { status: 500 })` for DB errors, `{ status: 401 }` for auth failures, `{ status: 400 }` for validation failures with Zod's `error.flatten()`.

**Navigation:** `notFound()` for missing resources; `redirect('/login')` for unauthenticated access.

No error boundaries or global error handlers are present.

## Logging

No logging library. No `console.log` statements in source code. Errors surface to the UI or are returned as HTTP responses. No server-side logging infrastructure.

## Comments

Inline section comments used in JSX to label form field groups:
```tsx
{/* Email */}
{/* Password */}
{/* Submit */}
```

No JSDoc/TSDoc. No block comments explaining logic. Comments are presentational labels only.

## Module Design

**Exports:**
- All components: `export default function ComponentName()` — one default export per file
- Utils and hooks: named exports — `export function cn(...)`, `export function useUser()`
- Types: named exports from `src/types/index.ts`

**Barrel files:** Not used. Import components directly by path. No `index.ts` re-exporting in component directories.

---

*Convention analysis: 2026-04-12*
