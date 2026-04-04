import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time: 'bg-green-50 text-green-700',
  part_time: 'bg-yellow-50 text-yellow-700',
  contract:  'bg-purple-50 text-purple-700',
  remote:    'bg-blue-50 text-blue-700',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  remote:    'Remote',
}

export default async function JobsPage() {
  const supabase = createClient()

  const [{ data: jobs }, { data: { user } }] = await Promise.all([
    supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])

  // Fetch saved job IDs for the logged-in user
  let savedJobIds: Set<string> = new Set()
  if (user) {
    const { data: saved } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('user_id', user.id)
    savedJobIds = new Set(saved?.map(s => s.job_id) ?? [])
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">All Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">{jobs?.length ?? 0} listings available</p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📭</p>
          <p className="text-gray-500 text-sm">No jobs posted yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              {/* Left — clickable */}
              <Link href={`/jobs/${job.id}`} className="flex-1 space-y-1 group">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
                    {JOB_TYPE_LABELS[job.type]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>
                <p className="text-xs text-gray-400">{formatDate(job.created_at)}</p>
              </Link>

              {/* Right */}
              <div className="flex items-center gap-2 shrink-0">
                <SaveJobButton
                  jobId={job.id}
                  isSaved={savedJobIds.has(job.id)}
                  isLoggedIn={!!user}
                  compact
                />
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
