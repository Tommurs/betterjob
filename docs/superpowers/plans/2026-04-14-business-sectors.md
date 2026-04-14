# Business Sectors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `sector` field to employer profiles and job listings, expose it as a dropdown in all employer-facing forms, display it as a badge on job detail pages, and make it a filterable param on the Browse Jobs page.

**Architecture:** A single shared constants file holds the 18-item sector list; a one-shot Supabase migration adds nullable `sector text` columns to `profiles` and `job_listings`; five components are updated to read/write/display the field; the Browse Jobs page wires the filter end-to-end.

**Tech Stack:** Next.js 14 App Router, Supabase (postgres + RLS), Tailwind CSS, TypeScript

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Create | `src/lib/constants/sectors.ts` | Single source of truth for sector list |
| Create | `supabase/migrations/011_sectors.sql` | Add `sector` to profiles + job_listings |
| Modify | `src/components/profile/ProfileForm.tsx` | Employer-only sector dropdown |
| Modify | `src/components/jobs/PostJobForm.tsx` | Sector dropdown on new listing |
| Modify | `src/components/jobs/EditJobForm.tsx` | Sector dropdown on edit, pre-populated |
| Modify | `src/app/jobs/[id]/page.tsx` | Render sector badge in header card |
| Modify | `src/components/jobs/SearchBar.tsx` | Add sector select to search form |
| Modify | `src/app/(dashboard)/jobs/page.tsx` | Wire sector searchParam → Supabase query |

---

## Task 1: Sector constants file

**Files:**
- Create: `src/lib/constants/sectors.ts`

- [ ] **Step 1: Create the constants file**

```ts
// src/lib/constants/sectors.ts
export const SECTORS = [
  'Technology & Software',
  'FinTech & Financial Services',
  'BioTech & Life Sciences',
  'Healthcare',
  'Education & EdTech',
  'Entertainment & Media',
  'Hospitality & Tourism',
  'Retail & E-commerce',
  'Manufacturing & Engineering',
  'Energy & Environment',
  'Real Estate & Construction',
  'Logistics & Supply Chain',
  'Legal & Compliance',
  'Marketing & Advertising',
  'Consulting & Professional Services',
  'Staffing & Recruiting',
  'Non-profit & Social Impact',
  'Government & Public Sector',
] as const
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/constants/sectors.ts
git commit -m "feat: add SECTORS constants"
```

---

## Task 2: Database migration

**Files:**
- Create: `supabase/migrations/011_sectors.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/011_sectors.sql
-- Add sector field to employer profiles and job listings

alter table public.profiles
  add column if not exists sector text;

alter table public.job_listings
  add column if not exists sector text;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration runs without error, both columns appear in the Supabase table editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/011_sectors.sql
git commit -m "feat: add sector column to profiles and job_listings"
```

---

## Task 3: Employer profile — sector dropdown

**Files:**
- Modify: `src/components/profile/ProfileForm.tsx`

The `ProfileForm` already conditionally shows employer vs jobseeker fields using `isEmployer`. The sector dropdown goes after the headline/tagline field and is only shown when `isEmployer` is true. It reads/writes the `sector` column via the existing `supabase.from('profiles').update(...)` call.

- [ ] **Step 1: Add the import and state**

At the top of `ProfileForm.tsx`, add the import after the existing imports:

```ts
import { SECTORS } from '@/lib/constants/sectors'
```

In the `ProfileForm` function, add sector state alongside the other `useState` calls (after `github` state):

```ts
const [sector, setSector] = useState(profile?.sector ?? '')
```

- [ ] **Step 2: Include sector in the update payload**

Find the `.update({...})` call inside `handleSubmit`. Add `sector` to the object:

```ts
const { error } = await supabase
  .from('profiles')
  .update({
    full_name: fullName,
    headline,
    bio,
    location,
    website,
    linkedin_url: linkedin,
    github_url: github,
    skills,
    sector: sector || null,
  })
  .eq('id', profile?.id)
```

- [ ] **Step 3: Add the sector dropdown to the JSX**

Add the following block immediately after the `{/* Headline */}` field group (after its closing `</div>`) and inside the `{isEmployer && (...)}` guard — or wrap it in its own `{isEmployer && ...}` check. Place it after the tagline/headline field:

```tsx
{/* Sector — employers only */}
{isEmployer && (
  <div>
    <label className="block text-sm font-medium text-[#1c1612] mb-1">
      Industry / Sector
      <span className="text-[#a8a29e] font-normal ml-1">(optional)</span>
    </label>
    <select
      value={sector}
      onChange={e => setSector(e.target.value)}
      className="input bg-white"
    >
      <option value="">Select a sector…</option>
      {SECTORS.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 4: Update the Profile interface at the top of the file**

The local `Profile` interface needs the new field:

```ts
interface Profile {
  id: string
  role: string
  full_name: string
  headline?: string
  bio?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  skills?: string[]
  sector?: string | null
}
```

- [ ] **Step 5: Manual verification**

Start the dev server (`npm run dev`). Log in as an employer, go to `/profile`. Confirm:
- "Industry / Sector" dropdown appears after the tagline field
- Selecting a value and saving persists it (refresh the page, dropdown shows the saved value)
- Logging in as a jobseeker — the dropdown does NOT appear

- [ ] **Step 6: Commit**

```bash
git add src/components/profile/ProfileForm.tsx
git commit -m "feat: add sector dropdown to employer ProfileForm"
```

---

## Task 4: Post Job form — sector dropdown

**Files:**
- Modify: `src/components/jobs/PostJobForm.tsx`

- [ ] **Step 1: Add the import**

```ts
import { SECTORS } from '@/lib/constants/sectors'
```

- [ ] **Step 2: Add sector state**

Add alongside the other `useState` declarations:

```ts
const [sector, setSector] = useState('')
```

- [ ] **Step 3: Include sector in the insert payload**

Find the `.insert({...})` call in `handleSubmit` and add:

```ts
sector: sector || null,
```

The full insert object becomes:

```ts
const { data, error } = await supabase
  .from('job_listings')
  .insert({
    title,
    company,
    location,
    type,
    salary_min: Number(salaryMin),
    salary_max: Number(salaryMax),
    experience_min: experienceMin || null,
    experience_max: experienceMax || null,
    description,
    requirements,
    required_degree: requiredDegree || null,
    preferred_degree: preferredDegree || null,
    preferred_qualifications: preferredQuals,
    fresh_grad_policy: freshGradPolicy === 'no' ? null : freshGradPolicy,
    messaging_enabled: messagingEnabled,
    sector: sector || null,
    is_active: true,
    employer_id: user.id,
  })
  .select('id')
  .single()
```

- [ ] **Step 4: Add the sector dropdown to the JSX**

Place this block after the closing `</div>` of the "Job type" section (after the 4-button grid):

```tsx
{/* Sector */}
<div>
  <label className="block text-sm font-medium text-[#1c1612] mb-1">
    Industry / Sector
    <span className="text-[#a8a29e] font-normal ml-1">(optional)</span>
  </label>
  <select
    value={sector}
    onChange={e => setSector(e.target.value)}
    className="input bg-white"
  >
    <option value="">Select a sector…</option>
    {SECTORS.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
  <p className="text-xs text-[#a8a29e] mt-1">
    This can differ from your company sector — useful for recruiting firms posting on behalf of a client.
  </p>
</div>
```

- [ ] **Step 5: Manual verification**

Go to `/jobs/post`. Confirm the sector dropdown appears after job type, is optional (form submits without it), and selecting a value saves it (check the Supabase table editor or view the listing detail page after Task 6).

- [ ] **Step 6: Commit**

```bash
git add src/components/jobs/PostJobForm.tsx
git commit -m "feat: add sector dropdown to PostJobForm"
```

---

## Task 5: Edit Job form — sector dropdown

**Files:**
- Modify: `src/components/jobs/EditJobForm.tsx`

- [ ] **Step 1: Add the import**

```ts
import { SECTORS } from '@/lib/constants/sectors'
```

- [ ] **Step 2: Update the `Job` interface**

Add `sector` to the `Job` interface at the top of the file:

```ts
interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary_min?: number | null
  salary_max?: number | null
  experience_min?: string | null
  experience_max?: string | null
  description: string
  requirements: string[]
  required_degree?: string | null
  preferred_degree?: string | null
  preferred_qualifications?: string[]
  fresh_grad_policy?: string | null
  messaging_enabled?: boolean
  sector?: string | null
}
```

- [ ] **Step 3: Add sector state (pre-populated from existing job)**

```ts
const [sector, setSector] = useState(job.sector ?? '')
```

- [ ] **Step 4: Include sector in the update payload**

Find the `.update({...})` call in `handleSubmit` and add:

```ts
sector: sector || null,
```

The full update object:

```ts
const { error } = await supabase
  .from('job_listings')
  .update({
    title,
    company,
    location,
    type,
    salary_min: Number(salaryMin),
    salary_max: Number(salaryMax),
    experience_min: experienceMin || null,
    experience_max: experienceMax || null,
    description,
    requirements,
    required_degree: requiredDegree || null,
    preferred_degree: preferredDegree || null,
    preferred_qualifications: preferredQuals,
    fresh_grad_policy: freshGradPolicy === 'no' ? null : freshGradPolicy,
    messaging_enabled: messagingEnabled,
    sector: sector || null,
  })
  .eq('id', job.id)
```

- [ ] **Step 5: Add the sector dropdown to the JSX**

Place immediately after the "Job type" section, matching PostJobForm exactly:

```tsx
{/* Sector */}
<div>
  <label className="block text-sm font-medium text-[#1c1612] mb-1">
    Industry / Sector
    <span className="text-[#a8a29e] font-normal ml-1">(optional)</span>
  </label>
  <select
    value={sector}
    onChange={e => setSector(e.target.value)}
    className="input bg-white"
  >
    <option value="">Select a sector…</option>
    {SECTORS.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
  <p className="text-xs text-[#a8a29e] mt-1">
    This can differ from your company sector — useful for recruiting firms posting on behalf of a client.
  </p>
</div>
```

- [ ] **Step 6: Manual verification**

Open an existing job listing and click "Edit listing". Confirm:
- Sector dropdown is pre-populated if a sector was previously saved
- Shows blank if no sector was set
- Changing and saving persists correctly

- [ ] **Step 7: Commit**

```bash
git add src/components/jobs/EditJobForm.tsx
git commit -m "feat: add sector dropdown to EditJobForm"
```

---

## Task 6: Job detail page — sector badge

**Files:**
- Modify: `src/app/jobs/[id]/page.tsx`

The badge goes in the header card, in the existing `flex items-center gap-2 flex-wrap mb-2` div that already contains the job type and fresh grad badges.

- [ ] **Step 1: Add the sector badge**

Find the block (around line 138–146):

```tsx
<div className="flex items-center gap-2 flex-wrap mb-2">
  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
    {JOB_TYPE_LABELS[job.type]}
  </span>
  {job.fresh_grad_policy && FRESH_GRAD_BADGE[job.fresh_grad_policy] && (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${FRESH_GRAD_BADGE[job.fresh_grad_policy].cls}`}>
      {FRESH_GRAD_BADGE[job.fresh_grad_policy].label}
    </span>
  )}
  {!job.is_active && (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f2ebe0] text-[#78716c]">
      Closed
    </span>
  )}
</div>
```

Add the sector badge after the job type span:

```tsx
<div className="flex items-center gap-2 flex-wrap mb-2">
  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
    {JOB_TYPE_LABELS[job.type]}
  </span>
  {job.sector && (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f2ebe0] text-[#78716c] ring-1 ring-[#e5d8c8]">
      {job.sector}
    </span>
  )}
  {job.fresh_grad_policy && FRESH_GRAD_BADGE[job.fresh_grad_policy] && (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${FRESH_GRAD_BADGE[job.fresh_grad_policy].cls}`}>
      {FRESH_GRAD_BADGE[job.fresh_grad_policy].label}
    </span>
  )}
  {!job.is_active && (
    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#f2ebe0] text-[#78716c]">
      Closed
    </span>
  )}
</div>
```

- [ ] **Step 2: Manual verification**

View a job listing that has a sector set. Confirm the sector badge appears between the job type pill and any other badges. View a listing without a sector — confirm no badge renders.

- [ ] **Step 3: Commit**

```bash
git add src/app/jobs/[id]/page.tsx
git commit -m "feat: display sector badge on job detail page"
```

---

## Task 7: SearchBar — sector filter

**Files:**
- Modify: `src/components/jobs/SearchBar.tsx`

The SearchBar is a client component. Add `initialSector` prop and a `<select>` for sector, submitted with the form.

- [ ] **Step 1: Add the import**

```ts
import { SECTORS } from '@/lib/constants/sectors'
```

- [ ] **Step 2: Update the Props interface and add state**

Replace:

```ts
interface Props {
  initialQuery?: string
  initialLocation?: string
}

export default function SearchBar({ initialQuery = '', initialLocation = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
```

With:

```ts
interface Props {
  initialQuery?: string
  initialLocation?: string
  initialSector?: string
}

export default function SearchBar({ initialQuery = '', initialLocation = '', initialSector = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [sector, setSector] = useState(initialSector)
```

- [ ] **Step 3: Include sector in the URL on submit**

Replace the `handleSearch` function:

```ts
function handleSearch(e: React.FormEvent) {
  e.preventDefault()
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (location.trim()) params.set('location', location.trim())
  if (sector) params.set('sector', sector)
  router.push(`/jobs?${params.toString()}`)
}
```

- [ ] **Step 4: Add the sector select to the form JSX**

Add a sector row below the location row, before the submit button `<div className="p-2">`. Insert a divider + select:

```tsx
{/* Sector divider */}
<div className="hidden sm:block w-px bg-[#e5d8c8] self-stretch my-3" />
<div className="block sm:hidden h-px bg-[#e5d8c8] mx-4" />

{/* Sector select */}
<div className="flex items-center flex-1 px-4 py-2.5 gap-3">
  <svg className="w-4 h-4 text-[#a8a29e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
  <select
    value={sector}
    onChange={e => setSector(e.target.value)}
    className="flex-1 text-sm outline-none text-[#1c1612] bg-transparent appearance-none cursor-pointer"
  >
    <option value="">All sectors</option>
    {SECTORS.map(s => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
</div>
```

The full updated return JSX for the form now contains: keyword input | divider | location input | divider | sector select | submit button.

- [ ] **Step 5: Commit**

```bash
git add src/components/jobs/SearchBar.tsx
git commit -m "feat: add sector filter to SearchBar"
```

---

## Task 8: Jobs page — wire sector filter end-to-end

**Files:**
- Modify: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Add `sector` to the `searchParams` interface**

Replace:

```ts
interface Props {
  searchParams: {
    q?: string
    location?: string
    type?: string
    view?: string
    skill?: string
    jobTitle?: string
    status?: string
    openToWork?: string
  }
}
```

With:

```ts
interface Props {
  searchParams: {
    q?: string
    location?: string
    type?: string
    sector?: string
    view?: string
    skill?: string
    jobTitle?: string
    status?: string
    openToWork?: string
  }
}
```

- [ ] **Step 2: Destructure `sector` from searchParams and add to the query**

Replace:

```ts
const { q, location, type } = searchParams
```

With:

```ts
const { q, location, type, sector } = searchParams
```

After the existing `if (location)` filter, add:

```ts
if (sector) query = query.eq('sector', sector)
```

- [ ] **Step 3: Pass `sector` to SearchBar**

Replace:

```tsx
<SearchBar initialQuery={q} initialLocation={location} />
```

With:

```tsx
<SearchBar initialQuery={q} initialLocation={location} initialSector={sector} />
```

- [ ] **Step 4: Preserve `sector` in the type filter pill links**

Find the `TYPE_FILTERS.map(...)` block. Each `params` object needs `sector` added:

```tsx
{TYPE_FILTERS.map(f => {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (location) params.set('location', location)
  if (sector) params.set('sector', sector)
  if (f.value) params.set('type', f.value)
  const isActive = (type ?? '') === f.value
  return (
    <Link
      key={f.value}
      href={`/jobs?${params.toString()}`}
      className={`text-sm px-4 py-1.5 rounded-xl font-semibold border transition-all duration-150 ${
        isActive
          ? 'bg-[#0f2d1f] text-[#faf6ef] border-[#0f2d1f] shadow-sm'
          : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:text-[#1c1612]'
      }`}
    >
      {f.label}
    </Link>
  )
})}
```

- [ ] **Step 5: Update `hasFilters` to include sector**

Replace:

```ts
const hasFilters = !!(q || location || type)
```

With:

```ts
const hasFilters = !!(q || location || type || sector)
```

- [ ] **Step 6: Manual verification**

Browse to `/jobs`. Confirm:
- Sector dropdown appears in the search bar
- Selecting a sector and clicking "Search jobs" filters listings to that sector
- Selecting a job type pill preserves the sector filter (check the URL)
- "Clear filters ×" appears when a sector is active and clicking it goes to `/jobs` with no params
- Listings without a sector set do NOT appear when a sector filter is active (expected — they have `null` sector, `.eq` won't match)

- [ ] **Step 7: Commit**

```bash
git add src/app/\(dashboard\)/jobs/page.tsx
git commit -m "feat: wire sector filter in Browse Jobs page"
```
