import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatSalary, formatDate } from '@/lib/utils'
import UnsaveButton from '@/components/jobs/UnsaveButton'

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time: 'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]',
  part_time: 'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#fde68a]',
  contract:  'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]',
  remote:    'bg-[#e0e7ff] text-[#3730a3] ring-1 ring-[#c7d2fe]',
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
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Saved Jobs</h1>
        <p className="text-sm text-[#78716c] mt-1">
          {total} saved job{total !== 1 ? 's' : ''}
        </p>
      </div>

      {total === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </div>
          <p className="text-[#78716c] text-sm">No saved jobs yet.</p>
          <Link href="/dashboard" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#1a4a32] transition-colors">
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
                className="group bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4
                           hover:border-[#c9b8a2] hover:shadow-[0_4px_8px_rgba(28,22,18,0.07)] hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Left — clickable */}
                <Link href={`/jobs/${job?.id}`} className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-[#1c1612] group-hover:text-[#0f2d1f] transition-colors">{job?.title}</h2>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job?.type]}`}>
                      {JOB_TYPE_LABELS[job?.type]}
                    </span>
                  </div>
                  <p className="text-sm text-[#78716c]">{job?.company} · {job?.location}</p>
                  <p className="text-sm font-semibold text-[#0f2d1f]">
                    {formatSalary(job?.salary_min, job?.salary_max)}
                  </p>
                  <p className="text-xs text-[#a8a29e]">Saved {formatDate(entry.created_at)}</p>
                </Link>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <UnsaveButton savedId={entry.id} />
                  <Link
                    href={`/jobs/${job?.id}`}
                    className="text-sm bg-[#0f2d1f] text-[#faf6ef] px-4 py-2 rounded-xl
                               hover:bg-[#1a4a32] transition-colors font-semibold active:scale-[0.98]"
                  >
                    View role
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
