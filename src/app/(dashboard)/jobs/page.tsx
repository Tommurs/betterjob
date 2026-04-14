import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import SearchBar from '@/components/jobs/SearchBar'
import CandidateSearch from '@/components/jobs/CandidateSearch'

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',   cls: 'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]' },
  fresh_grad_plus: { label: 'Fresh Grad + Exp', cls: 'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]' },
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time:  'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]',
  part_time:  'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#fde68a]',
  contract:   'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]',
  temporary:  'bg-[#fff7ed] text-[#9a3412] ring-1 ring-[#fed7aa]',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  contract:   'Contract',
  temporary:  'Temporary',
}

const TYPE_FILTERS = [
  { value: '',           label: 'All types' },
  { value: 'full_time',  label: 'Full-time' },
  { value: 'part_time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'temporary',  label: 'Temporary' },
]

const COMPANY_PALETTES = [
  'bg-[#e8ddd0] text-[#0f2d1f]',
  'bg-[#fef3c7] text-[#92400e]',
  'bg-[#d1fae5] text-[#065f46]',
  'bg-[#fce7f3] text-[#9d174d]',
  'bg-[#e0e7ff] text-[#3730a3]',
  'bg-[#fef9ec] text-[#b45309]',
  'bg-[#f0fdf4] text-[#166534]',
  'bg-[#fdf2f8] text-[#86198f]',
]

function companyPalette(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return COMPANY_PALETTES[Math.abs(h) % COMPANY_PALETTES.length]
}

function companyInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

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

  const { q, location, type, sector } = searchParams

  let query = supabase
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`)
  if (location) query = query.ilike('location', `%${location}%`)
  if (sector) query = query.eq('sector', sector)

  const [{ data: jobs }] = await Promise.all([
    query,
  ])

  let savedJobIds: Set<string> = new Set()
  if (user) {
    const { data: saved } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
    savedJobIds = new Set(saved?.map(s => s.job_id) ?? [])
  }

  const hasFilters = !!(q || location || type || sector)

  return (
    <div className="space-y-6">

      {/* Search */}
      <SearchBar initialQuery={q} initialLocation={location} initialSector={sector} />

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Results header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="heading-display text-xl font-bold text-[#1c1612]">
            {hasFilters ? 'Search results' : 'All Jobs'}
          </h1>
          <p className="text-sm text-[#78716c] mt-0.5">
            {jobs?.length ?? 0} listing{jobs?.length !== 1 ? 's' : ''}
            {q && <span> for <strong className="text-[#1c1612]">&quot;{q}&quot;</strong></span>}
            {location && <span> in <strong className="text-[#1c1612]">{location}</strong></span>}
            {sector && <span> · <strong className="text-[#1c1612]">{sector}</strong></span>}
          </p>
        </div>
        {hasFilters && (
          <Link
            href="/jobs"
            className="text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors font-medium"
          >
            Clear filters ×
          </Link>
        )}
      </div>

      {/* No results */}
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 10.607z" />
            </svg>
          </div>
          <p className="text-[#78716c] text-sm font-medium">
            {hasFilters ? 'No jobs matched your search.' : 'No jobs posted yet — check back soon!'}
          </p>
          {hasFilters && (
            <Link href="/jobs" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#166534] transition-colors">
              Clear all filters →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="group bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-5
                         shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]
                         flex flex-col sm:flex-row sm:items-center justify-between gap-4
                         hover:shadow-[0_4px_8px_rgba(28,22,18,0.07),0_12px_32px_rgba(15,45,31,0.11)]
                         hover:border-[#c9b8a2] hover:-translate-y-0.5
                         transition-all duration-200"
            >
              <Link href={`/jobs/${job.id}`} className="flex items-start gap-4 flex-1 min-w-0">
                {/* Company avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                 text-xs font-bold shrink-0 ${companyPalette(job.company)}`}>
                  {companyInitials(job.company)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-semibold text-[#1c1612] group-hover:text-[#0f2d1f] transition-colors">
                      {job.title}
                    </h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
                      {JOB_TYPE_LABELS[job.type]}
                    </span>
                    {job.fresh_grad_policy && FRESH_GRAD_BADGE[job.fresh_grad_policy] && (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${FRESH_GRAD_BADGE[job.fresh_grad_policy].cls}`}>
                        {FRESH_GRAD_BADGE[job.fresh_grad_policy].label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#78716c]">{job.company} · {job.location}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#0f2d1f]">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </p>
                    <span className="text-[#e5d8c8]">·</span>
                    <p className="text-xs text-[#a8a29e]">{formatDate(job.created_at)}</p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0 sm:pl-4">
                <SaveJobButton
                  jobId={job.id}
                  isSaved={savedJobIds.has(job.id)}
                  isLoggedIn={!!user}
                  compact
                />
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm bg-[#0f2d1f] text-[#faf6ef] px-4 py-2 rounded-xl
                             hover:bg-[#1a4a32] transition-colors font-semibold
                             active:scale-[0.98]"
                >
                  View role
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
