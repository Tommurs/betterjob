import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

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

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      id, status, created_at,
      job_listings (
        id, title, company, location, type
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
        <p className="text-sm text-gray-500 mt-1">
          {applications?.length ?? 0} application{applications?.length !== 1 ? 's' : ''} submitted
        </p>
      </div>

      {/* Empty state */}
      {!applications || applications.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">📋</p>
          <p className="text-gray-500 text-sm">You haven&apos;t applied to any jobs yet.</p>
          <Link href="/dashboard" className="inline-block text-sm text-blue-600 hover:underline">
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
                className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition-all"
              >
                {/* Left */}
                <div className="space-y-1">
                  <h2 className="font-semibold text-gray-900">{job?.title}</h2>
                  <p className="text-sm text-gray-500">
                    {job?.company} · {job?.location}
                  </p>
                  <p className="text-xs text-gray-400">Applied {formatDate(app.created_at)}</p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]}`}>
                    {STATUS_LABELS[app.status]}
                  </span>
                  <Link
                    href={`/jobs/${job?.id}`}
                    className="text-sm border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
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
