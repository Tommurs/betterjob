import Link from 'next/link'
import { JobListing } from '@/types'
import { formatSalary, formatDate } from '@/lib/utils'
import SaveJobButton from '@/components/jobs/SaveJobButton'

const FRESH_GRAD_BADGE: Record<string, { label: string; cls: string }> = {
  fresh_grad:      { label: 'Fresh Graduate',   cls: 'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]' },
  fresh_grad_plus: { label: 'Fresh Grad + Exp', cls: 'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]' },
}

const JOB_TYPE_COLOURS: Record<string, string> = {
  full_time:  'bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]',
  part_time:  'bg-[#fef3c7] text-[#92400e] ring-1 ring-[#fde68a]',
  contract:   'bg-[#ede9fe] text-[#5b21b6] ring-1 ring-[#ddd6fe]',
  temporary:  'bg-[#fff7ed] text-[#9a3412] ring-1 ring-[#fed7aa]',
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
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Curated for you</h1>
        <p className="text-sm text-[#78716c] mt-1">The newest listings, updated daily</p>
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 text-[#a8a29e] text-sm">
          No listings yet — check back soon!
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div
              key={job.id}
              className="bg-[#fffefb] border border-[#e5d8c8] rounded-xl p-5
                         hover:border-[#c9b8a2] hover:shadow-[0_4px_8px_rgba(28,22,18,0.07)]
                         transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left — fully clickable */}
              <Link href={`/jobs/${job.id}`} className="flex-1 space-y-1 group min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-[#1c1612] group-hover:text-[#0f2d1f] transition-colors">{job.title}</h2>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${JOB_TYPE_COLOURS[job.type]}`}>
                    {JOB_TYPE_LABELS[job.type]}
                  </span>
                  {(job as any).fresh_grad_policy && FRESH_GRAD_BADGE[(job as any).fresh_grad_policy] && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${FRESH_GRAD_BADGE[(job as any).fresh_grad_policy].cls}`}>
                      {FRESH_GRAD_BADGE[(job as any).fresh_grad_policy].label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#78716c]">
                  {job.company} · {job.location}
                </p>
                <p className="text-sm font-semibold text-[#0f2d1f]">
                  {formatSalary(job.salary_min, job.salary_max)}
                </p>
              </Link>

              {/* Right */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-[#a8a29e]">{formatDate(job.created_at)}</span>
                <SaveJobButton
                  jobId={job.id}
                  isSaved={savedJobIds.has(job.id)}
                  isLoggedIn={true}
                  compact
                />
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-sm bg-[#0f2d1f] text-[#faf6ef] px-4 py-2 rounded-lg
                             hover:bg-[#1a4a32] transition-colors font-semibold active:scale-[0.98]"
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
