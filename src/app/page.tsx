import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import SearchBar from '@/components/jobs/SearchBar'

const JOB_CATEGORIES = [
  { label: 'Engineering', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { label: 'Design',      color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
  { label: 'Marketing',   color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
  { label: 'Sales',       color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Finance',     color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Operations',  color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
]

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

export default async function HomePage() {
  const supabase = createClient()

  const [{ data: jobs }, { data: { user } }] = await Promise.all([
    supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
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

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero-pattern py-28 sm:py-36 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 text-white/60 text-xs
                          font-medium px-3.5 py-1.5 rounded-full mb-8 ring-1 ring-white/12">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Roles updated daily
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.06]
                         tracking-tight mb-6 text-balance">
            Find work that&apos;s<br />
            actually{' '}
            <span className="text-[#f59e0b] italic">better.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/50 mb-10 max-w-sm mx-auto leading-relaxed">
            Roles at companies that invest in their people. No noise, no filler.
          </p>

          <div className="max-w-2xl mx-auto">
            <SearchBar />
          </div>

          {/* Stats strip */}
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/35">
            <span>Thousands of open roles</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Updated daily</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Free to apply</span>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          Browse by category
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {JOB_CATEGORIES.map(cat => (
            <Link
              key={cat.label}
              href={`/jobs?category=${cat.label.toLowerCase()}`}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         border border-transparent transition-all duration-150 ${cat.color}`}
            >
              {cat.label}
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent listings ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Recent listings
          </h2>
          <Link
            href="/jobs"
            className="text-sm text-[#0f2d1f] font-semibold hover:text-[#166534]
                       transition-colors flex items-center gap-1"
          >
            View all
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-slate-500 text-sm">No listings yet — check back soon!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map(job => (
              <div
                key={job.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4
                           p-5 bg-white border border-slate-200/80 rounded-2xl
                           shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]
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
                      <h3 className="font-semibold text-slate-900 group-hover:text-[#0f2d1f] transition-colors">
                        {job.title}
                      </h3>
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
      </section>
    </main>
  )
}
