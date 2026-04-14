# Candidate Search — Design Spec
**Date:** 2026-04-13
**Branch:** design/visual-revamp

---

## Overview

Replace the employer-facing job browse experience with a candidate search feature. Employers can discover job seekers, filter by skills/location/title/status, and contact candidates directly. Job seekers retain full control via a searchable/private toggle.

---

## 1. Data Model

### New table: `work_experience`

```sql
create table public.work_experience (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text not null,
  start_date date not null,
  end_date date,
  is_current boolean default false,
  created_at timestamptz default now()
);
```

RLS: job seekers can manage their own rows; all authenticated users can read (filtered by profile searchability at the query level).

### Profiles table changes

- **Drop** `profile_visibility` column (was `public/employers_only/private`, never queried outside the settings form)
- **Add** `searchable boolean default true` — when `true`, the profile appears in employer candidate search

Migration: `010_candidate_search.sql`

---

## 2. Routing & Navigation

### Role-conditional `/jobs` page

The `/(dashboard)/jobs/page.tsx` server component reads the session role:
- `employer` → renders `<CandidateSearch />` component
- `jobseeker` / unauthenticated → renders existing job listings component (unchanged)

### Nav changes

- In `Navbar` and `Sidebar`, the "Browse Jobs" link label becomes **"Browse Candidates"** when `role === 'employer'`
- Employers still access their own job listings via the sidebar link (`/(dashboard)/jobs` management section — already exists)
- No new routes needed

---

## 3. Candidate Search UI

### New components

| File | Purpose |
|------|---------|
| `src/components/jobs/CandidateSearch.tsx` | Employer-facing browse page (server component) |
| `src/components/jobs/CandidateCard.tsx` | Individual candidate result card |

### Search & filters

| Filter | Input type | DB field |
|--------|-----------|---------|
| Keywords | Text | `profiles.full_name`, `profiles.headline`, `profiles.bio`, `profiles.skills[]` |
| Location | Text | `profiles.location` |
| Skills | Text | `profiles.skills[]` array contains |
| Job title | Text | `work_experience.title` (current + previous) |
| Job search status | Pill (All / Active / Open / Not looking) | `profiles.job_search_status` |
| Open to work | Checkbox toggle | `profiles.open_to_work` |

All filters compose via AND logic. Only profiles with `searchable = true` and `role = 'jobseeker'` are returned.

### Candidate card

Displays per result:
- **Avatar** — `avatar_url` if set, else initial-letter fallback (same pattern as `ProfileForm`)
- **Name** (`full_name`)
- **Headline**
- **Location**
- **Skills** — first 4–5 tags, "+N more" truncation
- **Title match highlight** — if job title filter is active and matches a `work_experience` entry:
  - Green "Current role" badge if `is_current = true`
  - Muted "Previous role" badge if `is_current = false`
- **Actions:** "View Profile" button (→ `/profile/[id]`) and "Message" button (→ opens/navigates to conversation with that candidate)

---

## 4. Work Experience on Job Seeker Profile

New "Work Experience" section added to `src/components/profile/ProfileForm.tsx` (or a dedicated `WorkExperienceForm.tsx` sub-component), visible to job seekers only.

### Entry fields
- Job title (required)
- Company (required)
- Start date — month/year picker (required)
- End date — month/year picker (disabled when "Current role" checked)
- "Current role" checkbox

### Display
- Listed chronologically, most recent first
- "Current" badge on active roles
- Inline edit and delete per entry

Employers see the work experience list as read-only on a candidate's public profile page.

---

## 5. Privacy Toggle

Added to `src/components/settings/PrivacyForm.tsx`, job seekers only.

- **Label:** "Searchable by employers"
- **Maps to:** `profiles.searchable` boolean
- **Default:** `true` (discoverable on signup)
- **Effect when off:** Profile excluded from all employer candidate search queries at the DB level via RLS/query filter. A direct profile URL returns nothing for employers when `searchable = false`.

---

## 6. Public Profile Page

Employers need a destination for the "View Profile" button. The existing profile page at `/profile` is the logged-in user's own profile. A new read-only public profile route is needed:

- Route: `/(dashboard)/candidates/[id]/page.tsx`
- Displays: avatar, name, headline, bio, location, skills, work experience list, social links
- No edit controls
- Only accessible to employers; job seekers accessing another user's profile are redirected

Chosen over `/profile/[id]` to keep the route employer-scoped and avoid collisions with the job seeker's own `/profile` page.

---

## 7. Out of Scope (Deferred)

- Profile photo upload UI (avatar_url display only for now; reminder saved)
- Candidate bookmarking / shortlisting
- Pagination (can add once data volume warrants it)
