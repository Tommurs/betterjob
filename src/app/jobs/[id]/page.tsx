import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatSalary, formatDate } from '@/lib/utils'
import ApplyButton from '@/components/jobs/ApplyButton'

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  remote:    'Remote',
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time: 'bg-green-50 text-green-700',
  part_time: 'bg-yellow-50 text-yellow-700',
  contract:  'bg-purple-50 text-purple-700',
  remote:    'bg-blue-50 text-blue-700',
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .single()

  if (!job) notFound()

  // Check if logged-in user has already applied
  const { data: { user } } = await supabase.auth.getUser()
  let hasApplied = false

  if (user) {
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', job.id)
      .eq('applicant_id', user.id)
      .single()

    hasApplied = !!existing
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

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((req: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    {req}
                  </li>
                ))}
              </ul>
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
            </div>

            <hr className="border-gray-100" />

            {/* Apply button */}
            <ApplyButton jobId={job.id} hasApplied={hasApplied} isLoggedIn={!!user} />
          </div>
        </div>

      </div>
    </main>
  )
}
