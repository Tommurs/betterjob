import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import MessageHiringManagerButton from '@/components/messages/MessageHiringManagerButton'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-[#f2ebe0] text-[#78716c]',
  reviewing:   'bg-[#fef3c7] text-[#92400e]',
  interviewed: 'bg-[#e0e7ff] text-[#3730a3]',
  offered:     'bg-[#d1fae5] text-[#065f46]',
  rejected:    'bg-red-50 text-red-600',
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pending',
  reviewing:   'Under Review',
  interviewed: 'Interviewed',
  offered:     'Offer Received',
  rejected:    'Not Selected',
}

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, created_at,
      job_listings (
        id, title, company, location, type, employer_id, messaging_enabled
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">My Applications</h1>
        <p className="text-sm text-[#78716c] mt-1">
          {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {/* Empty state */}
      {!applications || applications.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <p className="text-[#78716c] text-sm">You haven&apos;t applied to any jobs yet.</p>
          <Link href="/dashboard" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#1a4a32] transition-colors">
            Browse listings →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const job = app.job_listings
            return (
              <div
                key={app.id}
                className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4
                           hover:border-[#c9b8a2] hover:shadow-[0_4px_8px_rgba(28,22,18,0.07)] hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Left */}
                <div className="space-y-1">
                  <h2 className="font-semibold text-[#1c1612]">{job?.title}</h2>
                  <p className="text-sm text-[#78716c]">
                    {job?.company} · {job?.location}
                  </p>
                  <p className="text-xs text-[#a8a29e]">Applied {formatDate(app.created_at)}</p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                  {job?.messaging_enabled && job?.employer_id && (
                    <MessageHiringManagerButton
                      jobId={job.id}
                      employerId={job.employer_id}
                      applicantId={user.id}
                    />
                  )}
                  <Link
                    href={`/jobs/${job?.id}`}
                    className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-1.5 rounded-xl
                               hover:border-[#cfc0ad] hover:text-[#1c1612] transition-colors"
                  >
                    View job
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
