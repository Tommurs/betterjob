# Candidate Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the employer-facing job browse with a candidate search — employers find job seekers, view profiles, and message them directly; job seekers control discoverability via a searchable toggle.

**Architecture:** The `/jobs` route becomes role-conditional — employers see `<CandidateSearch />`, job seekers see the existing job listings. A new `work_experience` table powers job-title filtering and profile cards. All changes are additive except replacing `profile_visibility` with `searchable` on `profiles`.

**Tech Stack:** Next.js 14 App Router, Supabase (Postgres + RLS), Tailwind CSS (Forest & Cream design system), TypeScript

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/010_candidate_search.sql` |
| Create | `src/components/messages/CandidateMessageButton.tsx` |
| Create | `src/components/profile/WorkExperienceForm.tsx` |
| Modify | `src/app/(dashboard)/profile/page.tsx` |
| Modify | `src/components/settings/PrivacyForm.tsx` |
| Modify | `src/app/(dashboard)/settings/page.tsx` |
| Create | `src/components/jobs/CandidateCard.tsx` |
| Create | `src/components/jobs/CandidateSearchBar.tsx` |
| Create | `src/components/jobs/CandidateSearch.tsx` |
| Modify | `src/app/(dashboard)/jobs/page.tsx` |
| Modify | `src/components/layout/Navbar.tsx` |
| Modify | `src/components/layout/Sidebar.tsx` |
| Create | `src/app/(dashboard)/candidates/[id]/page.tsx` |
| Modify | `src/app/(dashboard)/messages/page.tsx` |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/010_candidate_search.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/010_candidate_search.sql

-- 1. Replace profile_visibility with searchable on profiles
alter table public.profiles
  add column if not exists searchable boolean not null default true;

alter table public.profiles
  drop column if exists profile_visibility;

-- 2. Create work_experience table
create table public.work_experience (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  created_at timestamptz default now()
);

alter table public.work_experience enable row level security;

create policy "Work experience is viewable by everyone"
  on public.work_experience for select using (true);

create policy "Users can insert own work experience"
  on public.work_experience for insert
  with check (auth.uid() = profile_id);

create policy "Users can update own work experience"
  on public.work_experience for update
  using (auth.uid() = profile_id);

create policy "Users can delete own work experience"
  on public.work_experience for delete
  using (auth.uid() = profile_id);

-- 3. Make conversations.job_id nullable (for direct employer→candidate messages)
alter table public.conversations
  alter column job_id drop not null;

-- Drop the inline unique constraint created in migration 003
alter table public.conversations
  drop constraint if exists conversations_job_id_employer_id_applicant_id_key;

-- Re-add as two partial unique indexes
create unique index if not exists conversations_job_unique
  on public.conversations (job_id, employer_id, applicant_id)
  where job_id is not null;

create unique index if not exists conversations_direct_unique
  on public.conversations (employer_id, applicant_id)
  where job_id is null;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies without error. If `conversations_job_id_employer_id_applicant_id_key` name fails, find the real name with:
```bash
npx supabase db diff --schema public
```
Then update the `drop constraint` line with the correct name.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/010_candidate_search.sql
git commit -m "feat: add work_experience table, searchable flag, nullable conversation job_id"
```

---

## Task 2: CandidateMessageButton

**Files:**
- Create: `src/components/messages/CandidateMessageButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  employerId: string
  candidateId: string
}

export default function CandidateMessageButton({ employerId, candidateId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .is('job_id', null)
      .eq('employer_id', employerId)
      .eq('applicant_id', candidateId)
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
      return
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({ employer_id: employerId, applicant_id: candidateId })
      .select('id')
      .single()

    if (!error && data) {
      router.push(`/messages/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-2 rounded-xl
                 hover:border-[#cfc0ad] hover:text-[#0f2d1f] transition-colors disabled:opacity-50"
    >
      {loading ? '…' : 'Message'}
    </button>
  )
}
```

- [ ] **Step 2: Verify the dev server compiles cleanly**

```bash
npm run dev
```

Expected: no TypeScript errors in terminal output.

- [ ] **Step 3: Commit**

```bash
git add src/components/messages/CandidateMessageButton.tsx
git commit -m "feat: add CandidateMessageButton for direct employer→candidate messaging"
```

---

## Task 3: WorkExperienceForm

**Files:**
- Create: `src/components/profile/WorkExperienceForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkExp {
  id: string
  profile_id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

interface Props {
  profileId: string
  initialExperience: WorkExp[]
}

const EMPTY_FORM = { title: '', company: '', start_date: '', end_date: '', is_current: false }

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function WorkExperienceForm({ profileId, initialExperience }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useState<WorkExp[]>(initialExperience)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase
      .from('work_experience')
      .insert({
        profile_id: profileId,
        title: form.title.trim(),
        company: form.company.trim(),
        start_date: form.start_date + '-01',
        end_date: form.is_current ? null : (form.end_date ? form.end_date + '-01' : null),
        is_current: form.is_current,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setEntries(prev =>
        [data, ...prev].sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
      )
      setForm(EMPTY_FORM)
      setAdding(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this experience entry?')) return
    const { error } = await supabase.from('work_experience').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1c1612]">Work Experience</h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-semibold text-[#0f2d1f] hover:text-[#1a4a32] transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(exp => (
            <div
              key={exp.id}
              className="flex items-start justify-between gap-3 bg-[#f9f5ef] border border-[#e5d8c8] rounded-xl px-4 py-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1c1612]">{exp.title}</p>
                  {exp.is_current && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46]">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#78716c]">{exp.company}</p>
                <p className="text-xs text-[#a8a29e]">
                  {formatMonthYear(exp.start_date)} – {exp.is_current ? 'Present' : formatMonthYear(exp.end_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(exp.id)}
                className="text-[#a8a29e] hover:text-red-500 transition-colors text-lg leading-none shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !adding && (
        <p className="text-xs text-[#a8a29e]">No experience added yet.</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="space-y-3 bg-[#f9f5ef] border border-[#e5d8c8] rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Job title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Frontend Engineer"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Company *</label>
              <input
                required
                type="text"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="input text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Start date *</label>
              <input
                required
                type="month"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">End date</label>
              <input
                type="month"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                disabled={form.is_current}
                className="input text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={e => setForm(f => ({ ...f, is_current: e.target.checked, end_date: '' }))}
              className="w-3.5 h-3.5 accent-[#0f2d1f]"
            />
            <span className="text-xs text-[#1c1612]">I currently work here</span>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-xs px-4 py-2">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError('') }}
              className="text-xs text-[#78716c] hover:text-[#1c1612] px-3 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/WorkExperienceForm.tsx
git commit -m "feat: add WorkExperienceForm component for job seeker experience history"
```

---

## Task 4: Add WorkExperienceForm to Profile Page

**Files:**
- Modify: `src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Update the profile page**

Replace the entire file content with:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import WorkExperienceForm from '@/components/profile/WorkExperienceForm'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: experience }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('work_experience')
      .select('*')
      .eq('profile_id', user.id)
      .order('start_date', { ascending: false }),
  ])

  const isJobseeker = profile?.role !== 'employer'

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Your Profile</h1>
        <p className="text-sm text-[#78716c] mt-1">
          {profile?.role === 'employer'
            ? 'This information appears on your job listings'
            : 'This information is shown to employers when you apply'}
        </p>
      </div>

      <ProfileForm profile={profile} />

      {isJobseeker && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <WorkExperienceForm profileId={user.id} initialExperience={experience ?? []} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/profile` as a job seeker. Confirm:
- Work Experience section appears below the main profile form
- Adding an entry saves and appears in the list
- Deleting an entry removes it
- Section does not appear when logged in as an employer

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/profile/page.tsx
git commit -m "feat: add work experience section to job seeker profile page"
```

---

## Task 5: Update PrivacyForm and Settings Page

**Files:**
- Modify: `src/components/settings/PrivacyForm.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Replace PrivacyForm**

Replace the entire file `src/components/settings/PrivacyForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toggle from './Toggle'

interface PrivacyFormProps {
  userId: string
  role: string
  searchable: boolean
  openToWork: boolean
  inviteToApply: boolean
  jobSearchStatus: string
}

export default function PrivacyForm({
  userId,
  role,
  searchable: initialSearchable,
  openToWork: initialOpenToWork,
  inviteToApply: initialInviteToApply,
  jobSearchStatus: initialJobSearchStatus,
}: PrivacyFormProps) {
  const supabase = createClient()
  const [searchable, setSearchable] = useState(initialSearchable ?? true)
  const [openToWork, setOpenToWork] = useState(initialOpenToWork ?? false)
  const [inviteToApply, setInviteToApply] = useState(initialInviteToApply ?? true)
  const [jobSearchStatus, setJobSearchStatus] = useState(initialJobSearchStatus || 'open')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const isJobseeker = role !== 'employer'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase
      .from('profiles')
      .update({
        ...(isJobseeker && {
          searchable,
          open_to_work: openToWork,
          invite_to_apply: inviteToApply,
          job_search_status: jobSearchStatus,
        }),
      })
      .eq('id', userId)
    setStatus(error ? 'error' : 'success')
    if (!error) setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isJobseeker && (
        <>
          <div className="flex items-start justify-between gap-4 py-0.5">
            <div>
              <p className="text-sm font-medium text-[#1c1612]">Searchable by employers</p>
              <p className="text-xs text-[#a8a29e] mt-0.5">
                Allow employers to find your profile in candidate search. Turn off to go private.
              </p>
            </div>
            <Toggle checked={searchable} onChange={setSearchable} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1c1612] mb-1.5">
              Job search status
            </label>
            <select
              value={jobSearchStatus}
              onChange={e => setJobSearchStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="active">Actively looking</option>
              <option value="open">Open to opportunities</option>
              <option value="not_looking">Not looking right now</option>
            </select>
            <p className="text-xs text-[#a8a29e] mt-1.5">
              Lets employers know how actively you are searching.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 py-0.5">
            <div>
              <p className="text-sm font-medium text-[#1c1612]">Open to Work</p>
              <p className="text-xs text-[#a8a29e] mt-0.5">
                Show a visible badge on your profile that you are open to new roles.
              </p>
            </div>
            <Toggle checked={openToWork} onChange={setOpenToWork} />
          </div>

          <div className="flex items-start justify-between gap-4 py-0.5">
            <div>
              <p className="text-sm font-medium text-[#1c1612]">Invite to Apply</p>
              <p className="text-xs text-[#a8a29e] mt-0.5">
                Allow employers to proactively invite you to apply for their open roles.
              </p>
            </div>
            <Toggle checked={inviteToApply} onChange={setInviteToApply} />
          </div>
        </>
      )}

      {!isJobseeker && (
        <p className="text-sm text-[#a8a29e]">Privacy settings apply to job seeker accounts.</p>
      )}

      {status === 'success' && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          Privacy settings saved.
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          Something went wrong. Please try again.
        </p>
      )}

      {isJobseeker && (
        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary"
        >
          {status === 'loading' ? 'Saving…' : 'Save changes'}
        </button>
      )}
    </form>
  )
}
```

- [ ] **Step 2: Update settings/page.tsx**

In `src/app/(dashboard)/settings/page.tsx`, change the profile select query and the PrivacyForm props.

Find this line:
```tsx
    .select('full_name, role, notification_preferences, profile_visibility, open_to_work, invite_to_apply, job_search_status, job_preferences')
```
Replace with:
```tsx
    .select('full_name, role, notification_preferences, searchable, open_to_work, invite_to_apply, job_search_status, job_preferences')
```

Find the PrivacyForm JSX:
```tsx
          <PrivacyForm
            userId={user.id}
            role={role}
            profileVisibility={profile?.profile_visibility ?? 'public'}
            openToWork={profile?.open_to_work ?? false}
            inviteToApply={profile?.invite_to_apply ?? true}
            jobSearchStatus={profile?.job_search_status ?? 'open'}
          />
```
Replace with:
```tsx
          <PrivacyForm
            userId={user.id}
            role={role}
            searchable={profile?.searchable ?? true}
            openToWork={profile?.open_to_work ?? false}
            inviteToApply={profile?.invite_to_apply ?? true}
            jobSearchStatus={profile?.job_search_status ?? 'open'}
          />
```

- [ ] **Step 3: Verify in browser**

Navigate to `/settings` as a job seeker. Confirm:
- "Searchable by employers" toggle appears and saves
- `profile_visibility` select is gone
- Other toggles still work

- [ ] **Step 4: Commit**

```bash
git add src/components/settings/PrivacyForm.tsx src/app/(dashboard)/settings/page.tsx
git commit -m "feat: replace profile_visibility with searchable toggle in privacy settings"
```

---

## Task 6: CandidateCard

**Files:**
- Create: `src/components/jobs/CandidateCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import Link from 'next/link'
import CandidateMessageButton from '@/components/messages/CandidateMessageButton'

interface WorkExp {
  id: string
  profile_id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

interface Candidate {
  id: string
  full_name: string
  headline: string | null
  location: string | null
  skills: string[]
  avatar_url: string | null
  open_to_work: boolean
  job_search_status: string
}

interface Props {
  candidate: Candidate
  matchedExperience: WorkExp | null
  employerId: string
}

export default function CandidateCard({ candidate, matchedExperience, employerId }: Props) {
  const initials = candidate.full_name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const visibleSkills = candidate.skills.slice(0, 5)
  const extraSkills = candidate.skills.length - visibleSkills.length

  return (
    <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-5
                    shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]
                    flex flex-col sm:flex-row sm:items-center justify-between gap-4
                    hover:shadow-[0_4px_8px_rgba(28,22,18,0.07),0_12px_32px_rgba(15,45,31,0.11)]
                    hover:border-[#c9b8a2] hover:-translate-y-0.5
                    transition-all duration-200">

      {/* Left: avatar + info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {candidate.avatar_url ? (
          <img
            src={candidate.avatar_url}
            alt={candidate.full_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-sm font-bold
                          flex items-center justify-center shrink-0">
            {initials}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-[#1c1612]">{candidate.full_name}</h2>
            {candidate.open_to_work && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]">
                Open to work
              </span>
            )}
          </div>

          {candidate.headline && (
            <p className="text-sm text-[#78716c]">{candidate.headline}</p>
          )}

          {candidate.location && (
            <p className="text-xs text-[#a8a29e]">{candidate.location}</p>
          )}

          {matchedExperience && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#78716c]">
                {matchedExperience.title} · {matchedExperience.company}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                matchedExperience.is_current
                  ? 'bg-[#d1fae5] text-[#065f46]'
                  : 'bg-[#f2ebe0] text-[#78716c]'
              }`}>
                {matchedExperience.is_current ? 'Current role' : 'Previous role'}
              </span>
            </div>
          )}

          {candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {visibleSkills.map(skill => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-[#f2ebe0] text-[#0f2d1f] border border-[#e5d8c8] font-medium"
                >
                  {skill}
                </span>
              ))}
              {extraSkills > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f2ebe0] text-[#a8a29e] border border-[#e5d8c8]">
                  +{extraSkills} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/candidates/${candidate.id}`}
          className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-2 rounded-xl
                     hover:border-[#cfc0ad] hover:text-[#0f2d1f] transition-colors"
        >
          View Profile
        </Link>
        <CandidateMessageButton employerId={employerId} candidateId={candidate.id} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/CandidateCard.tsx
git commit -m "feat: add CandidateCard component"
```

---

## Task 7: CandidateSearchBar

**Files:**
- Create: `src/components/jobs/CandidateSearchBar.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  initialQ?: string
  initialLocation?: string
  initialSkill?: string
  initialJobTitle?: string
  initialStatus?: string
  initialOpenToWork?: string
}

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Actively looking' },
  { value: 'open', label: 'Open to opportunities' },
  { value: 'not_looking', label: 'Not looking' },
]

export default function CandidateSearchBar({
  initialQ = '',
  initialLocation = '',
  initialSkill = '',
  initialJobTitle = '',
  initialStatus = '',
  initialOpenToWork = '',
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [location, setLocation] = useState(initialLocation)
  const [skill, setSkill] = useState(initialSkill)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [status, setStatus] = useState(initialStatus)
  const [openToWork, setOpenToWork] = useState(initialOpenToWork === 'true')

  function buildParams(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const values = { q, location, skill, jobTitle, status, openToWork: openToWork ? 'true' : '', ...overrides }
    Object.entries(values).forEach(([k, v]) => { if (v) params.set(k, v) })
    return params.toString()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/jobs?${buildParams()}`)
  }

  return (
    <div className="space-y-4">
      {/* Keyword search bar */}
      <form onSubmit={handleSearch}
        className="flex gap-0 bg-[#fffefb] rounded-2xl shadow-[0_4px_24px_rgba(28,22,18,0.12)]
                   overflow-hidden ring-1 ring-[#e5d8c8]">
        <div className="flex items-center flex-1 px-4 py-3 gap-3">
          <svg className="w-4 h-4 text-[#a8a29e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, headline, or bio"
            className="flex-1 text-sm outline-none text-[#1c1612] placeholder:text-[#a8a29e] bg-transparent"
          />
        </div>
        <div className="p-2">
          <button type="submit"
            className="bg-[#0f2d1f] text-white text-sm font-semibold px-6 py-2.5 rounded-xl
                       hover:bg-[#1a4a32] active:scale-[0.98] transition-all duration-150 whitespace-nowrap">
            Search
          </button>
        </div>
      </form>

      {/* Filters row */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location"
          className="input text-sm max-w-[150px]"
        />
        <input
          type="text"
          value={skill}
          onChange={e => setSkill(e.target.value)}
          placeholder="Skill (exact)"
          className="input text-sm max-w-[140px]"
        />
        <input
          type="text"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder="Job title"
          className="input text-sm max-w-[150px]"
        />
        <label className="flex items-center gap-1.5 text-sm text-[#78716c] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={openToWork}
            onChange={e => setOpenToWork(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0f2d1f]"
          />
          Open to work
        </label>
        <button type="submit" className="text-xs font-semibold text-[#0f2d1f] hover:text-[#1a4a32] transition-colors px-2">
          Apply
        </button>
      </form>

      {/* Status pill filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => {
          const isActive = status === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value)
                const params = new URLSearchParams()
                const values = { q, location, skill, jobTitle, openToWork: openToWork ? 'true' : '', status: f.value }
                Object.entries(values).forEach(([k, v]) => { if (v) params.set(k, v) })
                router.push(`/jobs?${params.toString()}`)
              }}
              className={`text-sm px-4 py-1.5 rounded-xl font-semibold border transition-all duration-150 ${
                isActive
                  ? 'bg-[#0f2d1f] text-[#faf6ef] border-[#0f2d1f] shadow-sm'
                  : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:text-[#1c1612]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/CandidateSearchBar.tsx
git commit -m "feat: add CandidateSearchBar client component"
```

---

## Task 8: CandidateSearch Server Component

**Files:**
- Create: `src/components/jobs/CandidateSearch.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CandidateCard from './CandidateCard'
import CandidateSearchBar from './CandidateSearchBar'

interface WorkExp {
  id: string
  profile_id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

interface Candidate {
  id: string
  full_name: string
  headline: string | null
  bio: string | null
  location: string | null
  skills: string[]
  avatar_url: string | null
  open_to_work: boolean
  job_search_status: string
}

interface Props {
  searchParams: {
    q?: string
    location?: string
    skill?: string
    jobTitle?: string
    status?: string
    openToWork?: string
  }
  employerId: string
}

export default async function CandidateSearch({ searchParams, employerId }: Props) {
  const supabase = createClient()
  const { q, location, skill, jobTitle, status, openToWork } = searchParams

  // Step 1: Job title filter — find matching profile ids from work_experience
  let titleMatchMap: Record<string, WorkExp> = {}
  if (jobTitle) {
    const { data: expMatches } = await supabase
      .from('work_experience')
      .select('id, profile_id, title, company, start_date, end_date, is_current')
      .ilike('title', `%${jobTitle}%`)

    expMatches?.forEach(exp => {
      // Prefer current role match; otherwise keep most recent
      const existing = titleMatchMap[exp.profile_id]
      if (!existing || (!existing.is_current && exp.is_current)) {
        titleMatchMap[exp.profile_id] = exp
      }
    })
  }

  // Step 2: Build profile query
  let query = supabase
    .from('profiles')
    .select('id, full_name, headline, bio, location, skills, avatar_url, open_to_work, job_search_status')
    .eq('role', 'jobseeker')
    .eq('searchable', true)
    .order('full_name')

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,bio.ilike.%${q}%`)
  }
  if (location) {
    query = query.ilike('location', `%${location}%`)
  }
  if (skill) {
    query = query.contains('skills', [skill])
  }
  if (status) {
    query = query.eq('job_search_status', status)
  }
  if (openToWork === 'true') {
    query = query.eq('open_to_work', true)
  }
  if (jobTitle) {
    const ids = Object.keys(titleMatchMap)
    if (ids.length === 0) {
      return <EmptyState filtered />
    }
    query = query.in('id', ids)
  }

  const { data: candidates } = await query

  const hasFilters = !!(q || location || skill || jobTitle || status || openToWork)

  return (
    <div className="space-y-6">
      <CandidateSearchBar
        initialQ={q}
        initialLocation={location}
        initialSkill={skill}
        initialJobTitle={jobTitle}
        initialStatus={status}
        initialOpenToWork={openToWork}
      />

      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="heading-display text-xl font-bold text-[#1c1612]">
            {hasFilters ? 'Search results' : 'All Candidates'}
          </h1>
          <p className="text-sm text-[#78716c] mt-0.5">
            {candidates?.length ?? 0} candidate{candidates?.length !== 1 ? 's' : ''}
            {q && <span> matching <strong className="text-[#1c1612]">&quot;{q}&quot;</strong></span>}
          </p>
        </div>
        {hasFilters && (
          <Link href="/jobs" className="text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors font-medium">
            Clear filters ×
          </Link>
        )}
      </div>

      {!candidates || candidates.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <div className="space-y-3">
          {candidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate as Candidate}
              matchedExperience={jobTitle ? (titleMatchMap[candidate.id] ?? null) : null}
              employerId={employerId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
        <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <p className="text-[#78716c] text-sm font-medium">
        {filtered ? 'No candidates matched your search.' : 'No candidates are currently searchable.'}
      </p>
      {filtered && (
        <Link href="/jobs" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#166534] transition-colors">
          Clear all filters →
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/CandidateSearch.tsx
git commit -m "feat: add CandidateSearch server component with filters"
```

---

## Task 9: Role-Conditional Jobs Page

**Files:**
- Modify: `src/app/(dashboard)/jobs/page.tsx`

- [ ] **Step 1: Add role check and CandidateSearch branch**

At the top of `src/app/(dashboard)/jobs/page.tsx`, add the import and role check. Insert after the existing imports:

```tsx
import CandidateSearch from '@/components/jobs/CandidateSearch'
```

Then modify the `JobsPage` function signature to accept a broader searchParams type and add the role check at the very start of the function body, before the existing Supabase query:

```tsx
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

export default async function JobsPage({ searchParams }: Props) {
  const supabase = createClient()

  // Role check — employers see candidate search unless ?view=listings
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'employer' && searchParams.view !== 'listings') {
      return <CandidateSearch searchParams={searchParams} employerId={user.id} />
    }
  }

  // ... rest of existing function unchanged (the const { q, location, type } = searchParams line onwards)
```

- [ ] **Step 2: Verify in browser**

1. Log in as an employer and navigate to `/jobs` — confirm candidate search renders
2. Navigate to `/jobs?view=listings` — confirm job listings render
3. Log in as a job seeker and navigate to `/jobs` — confirm job listings still render

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/jobs/page.tsx
git commit -m "feat: make /jobs role-conditional — employers see candidate search"
```

---

## Task 10: Nav and Sidebar Updates

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update Navbar**

In `src/components/layout/Navbar.tsx`, replace the static "Browse Jobs" link:

```tsx
          <Link
            href="/jobs"
            className="text-[#78716c] hover:text-[#1c1612] hover:bg-[#e5d8c8]/40 font-medium
                       transition-colors px-3 py-1.5 rounded-lg"
          >
            Browse Jobs
          </Link>
```

With a role-conditional version:

```tsx
          <Link
            href="/jobs"
            className="text-[#78716c] hover:text-[#1c1612] hover:bg-[#e5d8c8]/40 font-medium
                       transition-colors px-3 py-1.5 rounded-lg"
          >
            {profile?.role === 'employer' ? 'Browse Candidates' : 'Browse Jobs'}
          </Link>
```

- [ ] **Step 2: Update Sidebar**

In `src/components/layout/Sidebar.tsx`, replace `EMPLOYER_NAV` with:

```tsx
const EMPLOYER_NAV = [
  { label: 'Browse Candidates', href: '/jobs' },
  { label: 'Posted Jobs',       href: '/dashboard' },
  { label: 'Post a Job',        href: '/jobs/post' },
  { label: 'Browse Jobs',       href: '/jobs?view=listings' },
  { label: 'Messages',          href: '/messages' },
  { label: 'Profile',           href: '/profile' },
  { label: 'Recycle Bin',       href: '/recyclebin' },
  { label: 'Settings',          href: '/settings' },
]
```

- [ ] **Step 3: Verify in browser**

1. As an employer: nav shows "Browse Candidates", sidebar shows both "Browse Candidates" and "Browse Jobs"
2. As a job seeker: nav still shows "Browse Jobs", sidebar unchanged
3. Logged out: nav shows "Browse Jobs"

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx src/components/layout/Sidebar.tsx
git commit -m "feat: update nav labels — Browse Candidates for employers, Browse Jobs in sidebar"
```

---

## Task 11: Public Candidate Profile Page

**Files:**
- Create: `src/app/(dashboard)/candidates/[id]/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CandidateMessageButton from '@/components/messages/CandidateMessageButton'

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: viewer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (viewer?.role !== 'employer') redirect('/jobs')

  const [{ data: candidate }, { data: experience }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, headline, bio, location, skills, avatar_url, open_to_work, job_search_status, linkedin_url, github_url')
      .eq('id', params.id)
      .eq('role', 'jobseeker')
      .eq('searchable', true)
      .single(),
    supabase
      .from('work_experience')
      .select('*')
      .eq('profile_id', params.id)
      .order('start_date', { ascending: false }),
  ])

  if (!candidate) notFound()

  const initials = candidate.full_name
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const JOB_SEARCH_LABELS: Record<string, string> = {
    active: 'Actively looking',
    open: 'Open to opportunities',
    not_looking: 'Not looking',
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/jobs" className="text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors">
          ← Back to candidates
        </Link>
      </div>

      {/* Header */}
      <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                      shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="flex items-start gap-5">
          {candidate.avatar_url ? (
            <img
              src={candidate.avatar_url}
              alt={candidate.full_name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-2xl font-bold
                            flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-xl font-bold text-[#1c1612]">{candidate.full_name}</h1>
              {candidate.open_to_work && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]">
                  Open to work
                </span>
              )}
            </div>
            {candidate.headline && <p className="text-sm text-[#78716c]">{candidate.headline}</p>}
            {candidate.location && <p className="text-xs text-[#a8a29e]">{candidate.location}</p>}
            {candidate.job_search_status && (
              <p className="text-xs text-[#a8a29e]">{JOB_SEARCH_LABELS[candidate.job_search_status]}</p>
            )}
          </div>

          <CandidateMessageButton employerId={user.id} candidateId={candidate.id} />
        </div>
      </div>

      {/* About */}
      {candidate.bio && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">About</h2>
          <p className="text-sm text-[#78716c] whitespace-pre-line">{candidate.bio}</p>
        </div>
      )}

      {/* Work Experience */}
      {experience && experience.length > 0 && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-4">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp: any) => (
              <div key={exp.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0f2d1f] mt-2 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1c1612]">{exp.title}</p>
                    {exp.is_current && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78716c]">{exp.company}</p>
                  <p className="text-xs text-[#a8a29e] mt-0.5">
                    {formatMonthYear(exp.start_date)} – {exp.is_current ? 'Present' : formatMonthYear(exp.end_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill: string) => (
              <span
                key={skill}
                className="text-xs px-3 py-1.5 rounded-full bg-[#f2ebe0] text-[#0f2d1f] border border-[#e5d8c8] font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(candidate.linkedin_url || candidate.github_url) && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">Links</h2>
          <div className="flex flex-col gap-2">
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#0f2d1f] hover:underline">
                LinkedIn →
              </a>
            )}
            {candidate.github_url && (
              <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#0f2d1f] hover:underline">
                GitHub →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

1. As an employer, click "View Profile" on a candidate card — confirm full profile renders
2. Navigate to `/candidates/[id]` as a job seeker — confirm redirect to `/jobs`
3. Navigate to `/candidates/[nonexistent-id]` — confirm 404

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/candidates/
git commit -m "feat: add public candidate profile page for employers"
```

---

## Task 12: Fix Messages Page for Null Job ID Conversations

**Files:**
- Modify: `src/app/(dashboard)/messages/page.tsx`

- [ ] **Step 1: Update the conversation subtitle**

In `src/app/(dashboard)/messages/page.tsx`, find this line:

```tsx
                  <p className="text-xs text-[#78716c] truncate mt-0.5">
                    Re: {conv.job_listings?.title} · {conv.job_listings?.company}
                  </p>
```

Replace with:

```tsx
                  <p className="text-xs text-[#78716c] truncate mt-0.5">
                    {conv.job_listings
                      ? `Re: ${conv.job_listings.title} · ${conv.job_listings.company}`
                      : 'Direct message'}
                  </p>
```

- [ ] **Step 2: Verify in browser**

Start a direct conversation via the candidate search Message button, then navigate to `/messages`. Confirm the conversation shows "Direct message" as the subtitle rather than broken text.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/messages/page.tsx
git commit -m "fix: handle null job_id in messages list for direct employer→candidate conversations"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Data model: `work_experience` table + `searchable` on profiles + nullable `conversations.job_id` — Task 1
- ✅ Role-conditional `/jobs` — Task 9
- ✅ Nav label changes — Task 10
- ✅ Candidate search UI with all filters (keywords, location, skill, job title, status, open to work) — Tasks 7 & 8
- ✅ Candidate card with avatar, skills, title match highlight, View Profile + Message — Task 6
- ✅ Work experience form on job seeker profile — Tasks 3 & 4
- ✅ Privacy searchable toggle — Task 5
- ✅ Public candidate profile page at `/candidates/[id]` — Task 11
- ✅ Direct messaging button — Task 2
- ✅ Messages page null job_id fix — Task 12
- ✅ Sidebar "Browse Jobs" for employers at `/jobs?view=listings` — Task 10
