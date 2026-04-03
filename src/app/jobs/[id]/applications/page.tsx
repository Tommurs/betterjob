import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import StatusUpdater from '@/components/jobs/StatusUpdater'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-gray-100 text-gray-600',
  reviewing:   'bg-yellow-50 text-yellow-700',
  interviewed: 'bg-blue-50 text-blue-700',
  offered:     'bg-green-50 text-green-700',
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
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{job.title}</h1>
          <p className="text-sm text-gray-500">{job.company} · {job.location}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-blue-600">{total}</p>
          <p className="text-xs text-gray-400">applicant{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Empty state */}
      {total === 0 ? (
        <div className="text-center py-20 space-y-2">
          <p className="text-4xl">📭</p>
          <p className="text-gray-500 text-sm">No applications yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications!.map((app: any) => {
            const profile = app.profiles
            return (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
              >
                {/* Applicant info */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                      {profile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{profile?.full_name ?? 'Unknown'}</p>
                      {profile?.headline && (
                        <p className="text-sm text-gray-500">{profile.headline}</p>
                      )}
                      {profile?.location && (
                        <p className="text-xs text-gray-400">{profile.location}</p>
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
                      <span key={skill} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Cover letter */}
                {app.cover_letter && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600 leading-relaxed">
                    {app.cover_letter}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-3">
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {profile?.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline">
                        GitHub
                      </a>
                    )}
                    <span className="text-xs text-gray-400">Applied {formatDate(app.created_at)}</span>
                  </div>

                  {/* Status updater */}
                  <StatusUpdater applicationId={app.id} currentStatus={app.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
