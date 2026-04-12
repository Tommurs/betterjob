# Coding Conventions

**Analysis Date:** 2026-04-12

## Naming Patterns

**Files:**
- React components: PascalCase `.tsx` — `LoginForm.tsx`, `SaveJobButton.tsx`, `EmployerDashboard.tsx`
- Pages: lowercase `page.tsx` (Next.js App Router convention)
- Hooks: camelCase prefixed with `use` — `useUser.ts`, `useSupabase.ts`
- Utilities/libs: camelCase index files — `src/lib/utils/index.ts`, `src/lib/supabase/client.ts`
- Validation schemas: camelCase with `Schema` suffix — `jobSchema`, `loginSchema`
- Types/interfaces: PascalCase — `JobListing`, `UserRole`, `Props`

**Functions:**
- Regular functions: camelCase — `handleSubmit`, `handleDelete`, `addRequirement`, `formatSalary`
- Event handlers: `handle` prefix — `handleApplyClick`, `handleSubmit`, `handleToggle`
- Helper actions: descriptive verbs — `addRequirement`, `removeRequirement`, `formatDate`
- React components: PascalCase function declarations — `export default function LoginForm()`
- Hooks: `use` prefix — `useUser`, `useSupabase`

**Variables:**
- camelCase throughout — `coverLetter`, `salaryMin`, `freshGradPolicy`, `loadingId`
- Boolean state: descriptive — `loading`, `saved`, `applied`, `showModal`
- Constants (module-level data): SCREAMING_SNAKE_CASE — `JOB_TYPES`, `DEGREE_OPTIONS`, `EXP_VALUES`, `JOB_TYPE_LABELS`

**Types:**
- Inline props interface named `Props` — always `interface Props { ... }` (not `ComponentNameProps`)
- Domain type names: PascalCase without suffix — `User`, `JobListing`, `Application`, `Profile`
- Union string literals for enums — `'jobseeker' | 'employer' | 'admin'`
- Zod-inferred types: `export type JobFormData = z.infer<typeof jobSchema>`

## Code Style

**Formatting:**
- No Prettier config detected — formatting is handled by ESLint via `next/core-web-vitals` and `next/typescript`
- Single quotes for strings in JS/TS code: `'use client'`, `import { useState } from 'react'`
- Double quotes for JSX attribute strings: `className="..."`, `type="text"`
- No semicolons (consistent across sampled files)
- Arrow functions for inline callbacks: `e => setEmail(e.target.value)`, `prev => [...prev, trimmed]`
- Regular `function` declarations for named component functions and handlers (not arrow functions)

**Linting:**
- ESLint config: `next/core-web-vitals` + `next/typescript` (`.eslintrc.json`)
- TypeScript strict mode enabled in `tsconfig.json`
- `skipLibCheck: true`, `noEmit: true`

## Import Organization

**Order (observed pattern):**
1. React and Next.js — `'react'`, `'next/navigation'`, `'next/link'`
2. External packages — `'@supabase/supabase-js'`, `'zod'`
3. Internal aliases (`@/`) — `'@/lib/supabase/client'`, `'@/lib/utils'`, `'@/components/...'`, `'@/types'`

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for internal imports — never relative paths like `../../`

**Example:**
```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
```

## Component Patterns

**Client vs Server Components:**
- Client components explicitly declare `'use client'` at the top of the file
- Server components have no directive — they are `async` functions that `await` Supabase calls directly
- Pattern: page-level Server Components fetch data, then pass it as props to Client Components

**Props Interface:**
- Always define a local `interface Props { ... }` directly above the component function
- Destructure props inline in the function signature: `function Foo({ jobId, isSaved }: Props)`
- Optional props documented with `?` — `compact?: boolean`

**State Management:**
- All state is local React `useState` — no global state library used
- Optimistic UI: update local state immediately after Supabase calls, then `router.refresh()` to sync server state
- Pattern for loading: single `loading` boolean state + `disabled={loading}` on submit buttons
- Error state: `const [error, setError] = useState('')` — string, empty string = no error

**Example component skeleton:**
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  isLoggedIn: boolean
}

export default function SomeButton({ jobId, isLoggedIn }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAction() {
    setLoading(true)
    const { error } = await supabase.from('table').insert({ ... })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    router.refresh()
  }

  return <button onClick={handleAction} disabled={loading}>...</button>
}
```

**Sub-components:**
- Small render-only sub-components defined as inner functions inside the parent component body (e.g., `JobCard` inside `EmployerDashboard`, `QualList` inside `PostJobForm`)
- These are NOT exported — they exist purely to reduce JSX repetition in the same file

**Async Server Components:**
```typescript
// No 'use client' — async function, awaits directly
export default async function DashboardPage() {
  const supabase = createClient()  // server client
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // fetch data, pass to client component
  return <ClientComponent data={data} />
}
```

## Supabase Client Usage

- **Server context** (pages, layouts, API routes): `import { createClient } from '@/lib/supabase/server'`
- **Client context** (components with `'use client'`): `import { createClient } from '@/lib/supabase/client'`
- In client components, call `createClient()` directly at the top of the function body (not in a hook effect) — or use `useSupabase()` hook which memoizes it
- Never import server client in a client component or vice versa

## Form Handling

- Forms use controlled inputs with `useState` per field — no form library
- Validation is inline using derived computed values (not schema validation in client components)
- Zod schemas in `src/lib/validations/` are used **only** in API route handlers (`safeParse`)
- Submit buttons show loading state: `{loading ? 'Submitting...' : 'Submit'}`
- Disabled submit when invalid: compute a `canSubmit` boolean from field values

## Error Handling

**Patterns:**
- Supabase errors: destructure `{ error }` from response, check `if (error)` before proceeding
- Display errors inline with red styled `<p>` elements:
  ```tsx
  {error && (
    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
      {error}
    </p>
  )}
  ```
- Early return on error: set error state, reset loading, `return` — do not fall through
- API routes: `return NextResponse.json({ error: error.message }, { status: 500 })`

## Tailwind CSS Patterns

- All styling via Tailwind utility classes directly on JSX elements — no CSS modules or styled components
- Common patterns:
  - Input: `w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`
  - Primary button: `bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`
  - Error text: `text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2`
- Reusable class strings assigned to `const` variables when shared within a file: `const inputClass = '...'`
- Utility function `cn()` from `@/lib/utils` (clsx + tailwind-merge) available for conditional class merging

## Module Design

**Exports:**
- Components: always `export default` — one component per file
- Utilities/schemas: named exports — `export function cn()`, `export const jobSchema`
- Types: named exports from `src/types/index.ts`
- Hooks: named exports — `export function useUser()`

**Barrel Files:**
- `src/lib/utils/index.ts` — exports all utility functions
- `src/types/index.ts` — exports all shared domain types
- No barrel for components — import directly from component file path

## TypeScript Usage

- `strict: true` in tsconfig — all code must be fully typed
- Props typed via local `interface Props` (not inline generics)
- Avoid `any` — though some `any` appears in dashboard page for Supabase query results (known gap)
- Type assertions with `!` for env vars: `process.env.NEXT_PUBLIC_SUPABASE_URL!`
- Prefer `type` for union types, `interface` for object shapes
- Zod schemas auto-generate types: `z.infer<typeof schema>`

---

*Convention analysis: 2026-04-12*
