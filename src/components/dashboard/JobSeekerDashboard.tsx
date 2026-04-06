import Link from 'next/link'
import { JobListing } from '@/types'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time:  'bg-green-50 text-green-700',
  part_time:  'bg-yellow-50 text-yellow-700',
  contract:   'bg-purple-50 text-purple-700',
  temporary:  'bg-orange-50 text-orange-700',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time:  'Full-time',
  part_time:  'Part-time',
  contract:   'Contract',
  temporary:  'Temporary',
}

interface Props {
  jobs: JobListing[]
  savedJobIds: Set<string>
}

export default function JobSeekerDashboard({ jobs, savedJobIds }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Curated for you</h1>
        <p className="text-sm text-gray-500 mt-1">The newest listings, updated daily</p>
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No listings yet — check back soon!
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left — fully clickable */}
              <Link href={`/jobs/${job.id}`} className="flex-1 space-y-1 group min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job.title}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
                    {JOB_TYPE_LABELS[job.type]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {job.company} · {job.location}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>
              </Link>

              {/* Right */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400">{formatDate(job.created_at)}</span>
                <SaveJobButton
                  jobId={job.id}
                  isSaved={savedJobIds.has(job.id)}
                  isLoggedIn={true}
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
    </div>
  )
}
