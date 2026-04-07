import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'
import SearchBar from '@/components/jobs/SearchBar'

const JOB_CATEGORIES = [
  { label: 'Engineering', icon: '💻' },
  { label: 'Design',      icon: '🎨' },
  { label: 'Marketing',   icon: '📣' },
  { label: 'Sales',       icon: '📈' },
  { label: 'Finance',     icon: '💰' },
  { label: 'Operations',  icon: '⚙️' },
]

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',   cls: 'bg-teal-50 text-teal-700' },
  fresh_grad_plus: { label: 'Fresh Grad + Exp', cls: 'bg-indigo-50 text-indigo-700' },
}

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

  // Fetch saved job IDs for logged-in user
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
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Find a job that&apos;s actually{' '}
            <span className="text-blue-600">better</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10">
            Thousands of roles at companies that care about their people.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Browse by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {JOB_CATEGORIES.map(cat => (
            <Link
              key={cat.label}
              href={`/jobs?category=${cat.label.toLowerCase()}`}
              className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors group"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent listings</h2>
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {!jobs || jobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">📭</p>
            <p className="text-gray-400 text-sm">No listings yet — check back soon!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Left — clickable */}
                <Link href={`/jobs/${job.id}`} className="flex-1 group">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
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
                  <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {formatSalary(job.salary_min, job.salary_max)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(job.created_at)}</p>
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
      </section>
    </main>
  )
}
