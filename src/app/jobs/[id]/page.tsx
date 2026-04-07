import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import ApplyButton from '@/components/jobs/ApplyButton'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import EmployerJobActions from '@/components/jobs/EmployerJobActions'

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
  full_time:  'bg-green-50 text-green-700',
  part_time:  'bg-yellow-50 text-yellow-700',
  contract:   'bg-purple-50 text-purple-700',
  temporary:  'bg-orange-50 text-orange-700',
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the job — allow inactive listings for the owner
  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!job) notFound()

  const isOwner = !!user && user.id === job.employer_id

  // If deleted or inactive and not the owner, treat as not found
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

  // Application count for owners
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
                {JOB_TYPE_LABELS[job.type]}
              </span>
              {!job.is_active && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                  Closed
                </span>
              )}
              <span className="text-xs text-gray-400">Posted {formatDate(job.created_at)}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500">{job.company} · {job.location}</p>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3">About the role</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Required qualifications */}
          {(job.required_degree || job.requirements?.length > 0) && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Required qualifications</h2>
              {job.required_degree && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium text-gray-700">Education: </span>
                  {DEGREE_LABELS[job.required_degree] ?? job.required_degree}
                </p>
              )}
              {job.requirements?.length > 0 && (
                <ul className="space-y-2">
                  {job.requirements.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-blue-500 mt-0.5">✓</span>{req}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Preferred qualifications */}
          {(job.preferred_degree || job.preferred_qualifications?.length > 0) && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Preferred qualifications</h2>
              {job.preferred_degree && (
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium text-gray-700">Education: </span>
                  {DEGREE_LABELS[job.preferred_degree] ?? job.preferred_degree}
                </p>
              )}
              {job.preferred_qualifications?.length > 0 && (
                <ul className="space-y-2">
                  {job.preferred_qualifications.map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">◎</span>{q}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Sidebar card */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 sticky top-24">

            {/* Salary */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Salary</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatSalary(job.salary_min, job.salary_max)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Company</span>
                <span className="text-gray-800 font-medium">{job.company}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Location</span>
                <span className="text-gray-800 font-medium">{job.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-gray-800 font-medium">{JOB_TYPE_LABELS[job.type]}</span>
              </div>
              {(job.experience_min || job.experience_max) && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience</span>
                  <span className="text-gray-800 font-medium">
                    {job.experience_min && job.experience_max
                      ? `${job.experience_min} – ${job.experience_max}`
                      : job.experience_min || job.experience_max}
                  </span>
                </div>
              )}
            </div>

            <hr className="border-gray-100" />

            {/* Owner actions */}
            {isOwner ? (
              <div className="space-y-3">
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="flex items-center justify-between w-full bg-blue-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span>View applications</span>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {applicationCount}
                  </span>
                </Link>
                <Link
                  href={`/jobs/${job.id}/edit`}
                  className="flex items-center justify-center w-full border border-gray-300 text-gray-700 text-sm font-medium py-2.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  ✏️ Edit listing
                </Link>
                <EmployerJobActions jobId={job.id} isActive={job.is_active} />
              </div>
            ) : (
              <>
                <ApplyButton
              jobId={job.id}
              jobTitle={job.title}
              company={job.company}
              hasApplied={hasApplied}
              isLoggedIn={!!user}
            />
                <SaveJobButton jobId={job.id} isSaved={isSaved} isLoggedIn={!!user} />
              </>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}
