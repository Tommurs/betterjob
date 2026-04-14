import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import ApplyButton from '@/components/jobs/ApplyButton'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import EmployerJobActions from '@/components/jobs/EmployerJobActions'
import MessageHiringManagerButton from '@/components/messages/MessageHiringManagerButton'

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',          cls: 'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]' },
  fresh_grad_plus: { label: 'Fresh Grad + Experience', cls: 'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]' },
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
  full_time:  'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]',
  part_time:  'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#fde68a]',
  contract:   'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]',
  temporary:  'bg-[#fff7ed] text-[#9a3412] ring-1 ring-[#fed7aa]',
}

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
        className="inline-flex items-center gap-1.5 text-sm text-[#a8a29e] hover:text-[#78716c]
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
          <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                          shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_20px_rgba(28,22,18,0.06)]">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                               text-sm font-bold shrink-0 ${companyPalette(job.company)}`}>
                {companyInitials(job.company)}
              </div>

              <div className="flex-1 min-w-0">
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
                <h1 className="heading-display text-2xl font-bold text-[#1c1612] leading-snug">{job.title}</h1>
                <p className="text-[#78716c] mt-1">{job.company} · {job.location}</p>
                <p className="text-xs text-[#a8a29e] mt-1">Posted {formatDate(job.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                          shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_20px_rgba(28,22,18,0.06)]">
            <h2 className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-4">
              About the role
            </h2>
            <p className="text-sm text-[#78716c] leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Required qualifications */}
          {(job.required_degree || job.requirements?.length > 0) && (
            <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                            shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_20px_rgba(28,22,18,0.06)]">
              <h2 className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-4">
                Required qualifications
              </h2>
              {job.required_degree && (
                <p className="text-sm text-[#78716c] mb-3">
                  <span className="font-semibold text-[#1c1612]">Education: </span>
                  {DEGREE_LABELS[job.required_degree] ?? job.required_degree}
                </p>
              )}
              {job.requirements?.length > 0 && (
                <ul className="space-y-2.5">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#78716c]">
                      <span className="w-5 h-5 rounded-full bg-[#d1fae5] text-[#065f46] flex items-center
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
            <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                            shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_20px_rgba(28,22,18,0.06)]">
              <h2 className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-4">
                Preferred qualifications
              </h2>
              {job.preferred_degree && (
                <p className="text-sm text-[#78716c] mb-3">
                  <span className="font-semibold text-[#1c1612]">Education: </span>
                  {DEGREE_LABELS[job.preferred_degree] ?? job.preferred_degree}
                </p>
              )}
              {job.preferred_qualifications?.length > 0 && (
                <ul className="space-y-2.5">
                  {job.preferred_qualifications.map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#78716c]">
                      <span className="w-5 h-5 rounded-full bg-[#fef3c7] text-[#b45309] flex items-center
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
          <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6 space-y-5 sticky top-24
                          shadow-[0_4px_8px_rgba(28,22,18,0.07),0_12px_32px_rgba(15,45,31,0.10)]">

            {/* Salary */}
            <div>
              <p className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-1">
                Salary
              </p>
              <p className="heading-display text-2xl font-bold text-[#0f2d1f]">
                {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </div>

            <hr className="border-[#e5d8c8]" />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#a8a29e]">Company</span>
                <span className="text-[#1c1612] font-medium">{job.company}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#a8a29e]">Location</span>
                <span className="text-[#1c1612] font-medium">{job.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#a8a29e]">Type</span>
                <span className="text-[#1c1612] font-medium">{JOB_TYPE_LABELS[job.type]}</span>
              </div>
              {(job.experience_min || job.experience_max) && (
                <div className="flex justify-between items-center">
                  <span className="text-[#a8a29e]">Experience</span>
                  <span className="text-[#1c1612] font-medium">
                    {job.experience_min && job.experience_max
                      ? `${job.experience_min} – ${job.experience_max} yrs`
                      : `${job.experience_min || job.experience_max} yrs`}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-[#e5d8c8]" />

            {/* Actions */}
            {isOwner ? (
              <div className="space-y-2.5">
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="flex items-center justify-between w-full bg-[#0f2d1f] text-[#faf6ef]
                             text-sm font-semibold px-4 py-3 rounded-xl hover:bg-[#1a4a32]
                             transition-colors active:scale-[0.98]"
                >
                  <span>View applications</span>
                  <span className="bg-white/15 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {applicationCount}
                  </span>
                </Link>
                <Link
                  href={`/jobs/${job.id}/edit`}
                  className="flex items-center justify-center w-full border border-[#e5d8c8]
                             text-[#78716c] text-sm font-medium py-2.5 rounded-xl
                             hover:border-[#cfc0ad] hover:bg-[#f5ede0] transition-colors"
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
                {hasApplied && job.messaging_enabled && user && (
                  <MessageHiringManagerButton
                    jobId={job.id}
                    employerId={job.employer_id}
                    applicantId={user.id}
                  />
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
