import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import UnsaveButton from '@/components/jobs/UnsaveButton'

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

export default async function SavedJobsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: saved } = await supabase
    .from('saved_jobs')
    .select(`
      id,
      created_at,
      job_listings (
        id, title, company, location, type, salary_min, salary_max, created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const total = saved?.length ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Saved Jobs</h1>
        <p className="text-sm text-gray-500 mt-1">
          {total} saved job{total !== 1 ? 's' : ''}
        </p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">🔖</p>
          <p className="text-gray-500 text-sm">No saved jobs yet.</p>
          <Link href="/dashboard" className="inline-block text-sm text-blue-600 hover:underline">
            Browse listings →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {saved!.map((entry: any) => {
            const job = entry.job_listings
            return (
              <div
                key={entry.id}
                className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-all"
              >
                {/* Left — clickable */}
                <Link href={`/jobs/${job?.id}`} className="flex-1 space-y-1 group">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{job?.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job?.type]}`}>
                      {JOB_TYPE_LABELS[job?.type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{job?.company} · {job?.location}</p>
                  <p className="text-sm font-medium text-gray-700">
                    {formatSalary(job?.salary_min, job?.salary_max)}
                  </p>
                  <p className="text-xs text-gray-400">Saved {formatDate(entry.created_at)}</p>
                </Link>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <UnsaveButton savedId={entry.id} />
                  <Link
                    href={`/jobs/${job?.id}`}
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
