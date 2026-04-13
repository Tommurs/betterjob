import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import SearchBar from '@/components/jobs/SearchBar'

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',   cls: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100' },
  fresh_grad_plus: { label: 'Fresh Grad + Exp', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' },
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  part_time:  'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  contract:   'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  temporary:  'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
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
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
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
  searchParams: { q?: string; location?: string; type?: string }
}

export default async function JobsPage({ searchParams }: Props) {
  const supabase = createClient()
  const { q, location, type } = searchParams

  let query = supabase
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (q) query = query.or(`title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`)
  if (location) query = query.ilike('location', `%${location}%`)

  const [{ data: jobs }, { data: { user } }] = await Promise.all([
    query,
    supabase.auth.getUser(),
  ])

  let savedJobIds: Set<string> = new Set()
  if (user) {
    const { data: saved } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
    savedJobIds = new Set(saved?.map(s => s.job_id) ?? [])
  }

  const hasFilters = !!(q || location || type)

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      {/* Search */}
      <SearchBar initialQuery={q} initialLocation={location} />

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        {TYPE_FILTERS.map(f => {
          const params = new URLSearchParams()
          if (q) params.set('q', q)
          if (location) params.set('location', location)
          if (f.value) params.set('type', f.value)
          const isActive = (type ?? '') === f.value
          return (
            <Link
              key={f.value}
              href={`/jobs?${params.toString()}`}
              className={`text-sm px-4 py-1.5 rounded-xl font-semibold border transition-all duration-150 ${
                isActive
                  ? 'bg-[#0f2d1f] text-white border-[#0f2d1f] shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
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
          <h1 className="text-xl font-bold text-slate-900">
            {hasFilters ? 'Search results' : 'All Jobs'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {jobs?.length ?? 0} listing{jobs?.length !== 1 ? 's' : ''}
            {q && <span> for <strong className="text-slate-700">&quot;{q}&quot;</strong></span>}
            {location && <span> in <strong className="text-slate-700">{location}</strong></span>}
          </p>
        </div>
        {hasFilters && (
          <Link
            href="/jobs"
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium"
          >
            Clear filters ×
          </Link>
        )}
      </div>

      {/* No results */}
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 15.803a7.5 7.5 0 0 0 10.607 10.607z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">
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
              className="group bg-white border border-slate-200/80 rounded-2xl p-5
                         shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]
                         flex flex-col sm:flex-row sm:items-center justify-between gap-4
                         hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(15,45,31,0.09)]
                         hover:border-emerald-200/60 hover:-translate-y-0.5
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
                    <h2 className="font-semibold text-slate-900 group-hover:text-[#0f2d1f] transition-colors">
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
                  <p className="text-sm text-slate-500">{job.company} · {job.location}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-semibold text-[#0f2d1f]">
                      {formatSalary(job.salary_min, job.salary_max)}
                    </p>
                    <span className="text-slate-200">·</span>
                    <p className="text-xs text-slate-400">{formatDate(job.created_at)}</p>
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
                  className="text-sm bg-[#0f2d1f] text-white px-4 py-2 rounded-xl
                             hover:bg-[#166534] transition-colors font-semibold
                             active:scale-[0.98]"
                >
                  View role
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
