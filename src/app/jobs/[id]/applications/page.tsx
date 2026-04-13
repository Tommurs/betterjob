import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import StatusUpdater from '@/components/jobs/StatusUpdater'
import StartConversationButton from '@/components/messages/StartConversationButton'

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

export default async function JobApplicationsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Confirm this job belongs to the logged-in employer
  const { data: job } = await supabase
    .from('job_listings')
    .select('id, title, company, location, type')
    .eq('id', params.id)
    .eq('employer_id', user.id)
    .single()

  if (!job) notFound()

  // Fetch all applications with applicant profiles
  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, cover_letter, created_at,
      profiles (
        id, full_name, headline, location, linkedin_url, github_url, skills, avatar_url
      )
    `)
    .eq('job_id', job.id)
    .order('created_at', { ascending: false })

  const total = applications?.length ?? 0

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors font-medium">
            ← Back to dashboard
          </Link>
          <h1 className="heading-display text-xl font-bold text-[#1c1612] mt-2">{job.title}</h1>
          <p className="text-sm text-[#78716c]">{job.company} · {job.location}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="heading-display text-2xl font-bold text-[#0f2d1f]">{total}</p>
          <p className="text-xs text-[#a8a29e]">applicant{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Empty state */}
      {total === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <p className="text-[#78716c] text-sm">No applications yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications!.map((app: any) => {
            const profile = app.profiles
            return (
              <div
                key={app.id}
                className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6 space-y-4 shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]"
              >
                {/* Applicant info */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-sm font-semibold flex items-center justify-center shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1c1612]">{profile?.full_name ?? 'Unknown'}</p>
                      {profile?.headline && (
                        <p className="text-sm text-[#78716c]">{profile.headline}</p>
                      )}
                      {profile?.location && (
                        <p className="text-xs text-[#a8a29e]">{profile.location}</p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                </div>

                {/* Skills */}
                {profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span key={skill} className="text-xs bg-[#f2ebe0] text-[#0f2d1f] px-2.5 py-1 rounded-full border border-[#e5d8c8]">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cover letter */}
                {app.cover_letter && (
                  <div className="bg-[#faf6ef] border border-[#e5d8c8] rounded-xl px-4 py-3 text-sm text-[#78716c] leading-relaxed">
                    {app.cover_letter}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#0f2d1f] font-medium hover:text-[#1a4a32] transition-colors">
                        LinkedIn
                      </a>
                    )}
                    {profile?.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#0f2d1f] font-medium hover:text-[#1a4a32] transition-colors">
                        GitHub
                      </a>
                    )}
                    <span className="text-xs text-[#a8a29e]">Applied {formatDate(app.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <StartConversationButton
                      jobId={job.id}
                      employerId={user.id}
                      applicantId={profile?.id}
                    />
                    <StatusUpdater applicationId={app.id} currentStatus={app.status} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
