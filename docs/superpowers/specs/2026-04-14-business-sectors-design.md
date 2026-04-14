# Business Sectors — Design Spec

**Date:** 2026-04-14
**Branch:** design/visual-revamp
**Status:** Approved

---

## Overview

Add a `sector` field to employer profiles and job listings so that employers can categorise their company and each role they post by industry. Job seekers can filter the Browse Jobs page by sector. The field is not added to job seeker profiles.

The recruiting-company case is explicitly supported: an employer's profile sector (e.g. "Staffing & Recruiting") can differ from any individual listing's sector (e.g. "BioTech & Life Sciences"), because recruiting firms post roles on behalf of client companies in other industries.

---

## Sector List

18 fixed values, defined in `src/lib/constants/sectors.ts` and imported by all forms, filters, and display components. The label string is stored directly in the database — no separate ID.

```
Technology & Software
FinTech & Financial Services
BioTech & Life Sciences
Healthcare
Education & EdTech
Entertainment & Media
Hospitality & Tourism
Retail & E-commerce
Manufacturing & Engineering
Energy & Environment
Real Estate & Construction
Logistics & Supply Chain
Legal & Compliance
Marketing & Advertising
Consulting & Professional Services
Staffing & Recruiting
Non-profit & Social Impact
Government & Public Sector
```

---

## Database Schema

Single migration (`011_sectors.sql`):

```sql
-- Employer's own industry
alter table public.profiles
  add column if not exists sector text;

-- Sector the role belongs to (may differ from employer profile sector)
alter table public.job_listings
  add column if not exists sector text;
```

Both columns are nullable. Existing records remain valid. The fixed-list constraint is enforced at the form/UI layer, not via a database check constraint, so the list can be extended in code without a schema migration.

---

## UI Touchpoints

### 1. Employer Profile (`ProfileForm`)
- Sector dropdown added after the company tagline field.
- Visible to employers only (hidden for job seekers, consistent with the existing skills/LinkedIn/GitHub conditional).
- Optional — no required validation.

### 2. Post Job (`PostJobForm`)
- Sector dropdown added after the job type pill selector.
- Optional field.

### 3. Edit Job (`EditJobForm`)
- Same sector dropdown as PostJobForm, pre-populated from the existing listing's `sector` value.

### 4. Job Listing Page (`/jobs/[id]`)
- Sector displayed as a pill/badge alongside the job type badge.
- Only rendered when `sector` is set.
- Example: `Full-time · FinTech & Financial Services`

### 5. Browse Jobs — Search & Filter
- Sector dropdown added to `SearchBar`.
- Passes `?sector=<value>` as a URL query param.
- The `SearchBar` server component adds `.eq('sector', sector)` to the Supabase query when the param is present.
- "All sectors" default (no filter).

---

## Data Flow

```
User selects sector in SearchBar
  → URL: /jobs?sector=FinTech+%26+Financial+Services
  → SearchBar server component reads searchParams.sector
  → Supabase query: .eq('sector', sector)
  → Filtered listings returned and rendered
```

```
Employer sets sector in ProfileForm
  → profiles.sector updated via supabase.from('profiles').update({ sector })

Employer sets sector in PostJobForm / EditJobForm
  → job_listings.sector set on insert/update
```

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Single vs multi sector | Single | Cleaner UI, avoids dilution, matches industry standard |
| Stored as | Label string | List is fixed and hardcoded; no join needed |
| DB constraint | None (UI-enforced) | Allows list extension without schema migration |
| Sector on job seeker profile | No | Not requested; adds complexity without clear use case at this stage |
| Sector filterable by job seekers | Yes | Core use case — seekers browse jobs by industry |

---

## Files Affected

| File | Change |
|---|---|
| `supabase/migrations/011_sectors.sql` | New migration — adds `sector` to profiles and job_listings |
| `src/lib/constants/sectors.ts` | New file — exports `SECTORS` array |
| `src/components/profile/ProfileForm.tsx` | Add sector dropdown (employers only) |
| `src/components/jobs/PostJobForm.tsx` | Add sector dropdown |
| `src/components/jobs/EditJobForm.tsx` | Add sector dropdown, pre-populated |
| `src/app/jobs/[id]/page.tsx` | Display sector badge on listing |
| `src/components/jobs/SearchBar.tsx` | Add sector filter dropdown |
| `src/app/(dashboard)/jobs/page.tsx` | Pass sector searchParam to query |
