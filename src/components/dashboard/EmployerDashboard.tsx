import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface JobWithApplications {
  id: string
  title: string
  location: string
  type: string
  is_active: boolean
  created_at: string
  application_count: number
}

interface Props {
  jobs: JobWithApplications[]
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  remote:    'Remote',
}

export default function EmployerDashboard({ jobs }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Posted Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Sorted by applications received</p>
        </div>
        <Link
          href="/jobs/post"
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Post a job
        </Link>
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-gray-400 text-sm">You haven&apos;t posted any jobs yet.</p>
          <Link
            href="/jobs/post"
            className="inline-block text-sm text-blue-600 hover:underline"
          >
            Post your first job →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900">{job.title}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    job.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {job.location} · {JOB_TYPE_LABELS[job.type] ?? job.type}
                </p>
                <p className="text-xs text-gray-400">Posted {formatDate(job.created_at)}</p>
              </div>

              {/* Right */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{job.application_count}</p>
                  <p className="text-xs text-gray-400">applicants</p>
                </div>
                <Link
                  href={`/jobs/${job.id}/applications`}
                  className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
