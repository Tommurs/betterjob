import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import ApplyButton from '@/components/jobs/ApplyButton'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import EmployerJobActions from '@/components/jobs/EmployerJobActions'

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',          cls: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100' },
  fresh_grad_plus: { label: 'Fresh Grad + Experience', cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' },
}

const DEGREE_LABELS: Record<string, string> = {
  none:         'No formal education required',
  high_school:  'High School Diploma / GED',
  trade:        'Trade / Vocational Certificate',
  associate:    "Associate's Degree",
  bachelor:     "Bachelor's Degree",
  master:       "Master's Degree",
  doctorate:    'Doctorate / PhD',
  professional: 'Professional Degree (JD, MD, etc.)',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  contract:   'Contract',
  temporary:  'Temporary',
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  part_time:  'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  contract:   'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
  temporary:  'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
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

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  const isOwner = !!user && user.id === job.employer_id

  if (job.deleted_at || (!job.is_active && !isOwner)) notFound()

  let hasApplied = false
  let isSaved = false

  if (user && !isOwner) {
    const [{ data: existing }, { data: savedJob }] = await Promise.all([
      supabase
        .from('applications')
        .select('id')
        .eq('job_id', job.id)
        .eq('applicant_id', user.id)
        .single(),
      supabase
        .from('saved_jobs')
        .select('id')
        .eq('job_id', job.id)
        .eq('user_id', user.id)
        .single(),
    ])
    hasApplied = !!existing
    isSaved = !!savedJob
  }

  let applicationCount = 0
  if (isOwner) {
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', job.id)
    applicationCount = count ?? 0
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600
                   transition-colors mb-8 font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6
                          shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-start gap-4">
              {/* Company avatar */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                               text-sm font-bold shrink-0 ${companyPalette(job.company)}`}>
                {companyInitials(job.company)}
              </div>

              <div className="flex-1 min-w-0">
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
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                      Closed
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 leading-snug">{job.title}</h1>
                <p className="text-slate-500 mt-1">{job.company} · {job.location}</p>
                <p className="text-xs text-slate-400 mt-1">Posted {formatDate(job.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6
                          shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.05)]">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              About the role
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Required qualifications */}
          {(job.required_degree || job.requirements?.length > 0) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6
                            shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.05)]">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Required qualifications
              </h2>
              {job.required_degree && (
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold text-slate-800">Education: </span>
                  {DEGREE_LABELS[job.required_degree] ?? job.required_degree}
                </p>
              )}
              {job.requirements?.length > 0 && (
                <ul className="space-y-2.5">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center
                                       justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {req}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Preferred qualifications */}
          {(job.preferred_degree || job.preferred_qualifications?.length > 0) && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6
                            shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.05)]">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Preferred qualifications
              </h2>
              {job.preferred_degree && (
                <p className="text-sm text-slate-600 mb-3">
                  <span className="font-semibold text-slate-800">Education: </span>
                  {DEGREE_LABELS[job.preferred_degree] ?? job.preferred_degree}
                </p>
              )}
              {job.preferred_qualifications?.length > 0 && (
                <ul className="space-y-2.5">
                  {job.preferred_qualifications.map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center
                                       justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
                        </svg>
                      </span>
                      {q}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-5 sticky top-24
                          shadow-[0_4px_8px_rgba(0,0,0,0.06),0_12px_32px_rgba(15,45,31,0.08)]">

            {/* Salary */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                Salary
              </p>
              <p className="text-2xl font-bold text-[#0f2d1f]">
                {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Company</span>
                <span className="text-slate-800 font-medium">{job.company}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Location</span>
                <span className="text-slate-800 font-medium">{job.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Type</span>
                <span className="text-slate-800 font-medium">{JOB_TYPE_LABELS[job.type]}</span>
              </div>
              {(job.experience_min || job.experience_max) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Experience</span>
                  <span className="text-slate-800 font-medium">
                    {job.experience_min && job.experience_max
                      ? `${job.experience_min} – ${job.experience_max} yrs`
                      : `${job.experience_min || job.experience_max} yrs`}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Actions */}
            {isOwner ? (
              <div className="space-y-2.5">
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="flex items-center justify-between w-full bg-[#0f2d1f] text-white
                             text-sm font-semibold px-4 py-3 rounded-xl hover:bg-[#166534]
                             transition-colors active:scale-[0.98]"
                >
                  <span>View applications</span>
                  <span className="bg-white/15 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {applicationCount}
                  </span>
                </Link>
                <Link
                  href={`/jobs/${job.id}/edit`}
                  className="flex items-center justify-center w-full border border-slate-200
                             text-slate-600 text-sm font-medium py-2.5 rounded-xl
                             hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Edit listing
                </Link>
                <EmployerJobActions jobId={job.id} isActive={job.is_active} />
              </div>
            ) : (
              <div className="space-y-2.5">
                <ApplyButton
                  jobId={job.id}
                  jobTitle={job.title}
                  company={job.company}
                  hasApplied={hasApplied}
                  isLoggedIn={!!user}
                />
                <SaveJobButton jobId={job.id} isSaved={isSaved} isLoggedIn={!!user} />
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
