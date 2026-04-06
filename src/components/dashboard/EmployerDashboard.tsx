'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  activeJobs: JobWithApplications[]
  archivedJobs: JobWithApplications[]
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  remote:    'Remote',
}

export default function EmployerDashboard({ activeJobs: initialActive, archivedJobs: initialArchived }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [activeJobs, setActiveJobs]     = useState(initialActive)
  const [archivedJobs, setArchivedJobs] = useState(initialArchived)
  const [loadingId, setLoadingId]       = useState<string | null>(null)

  async function handleDelete(jobId: string) {
    if (!confirm('Move this listing to the recycle bin? It will be permanently deleted after 7 days.')) return
    setLoadingId(jobId)
    await supabase
      .from('job_listings')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', jobId)
    setActiveJobs(prev => prev.filter(j => j.id !== jobId))
    setArchivedJobs(prev => prev.filter(j => j.id !== jobId))
    setLoadingId(null)
  }

  async function handleRepost(jobId: string) {
    setLoadingId(jobId)
    await supabase
      .from('job_listings')
      .update({ is_active: true })
      .eq('id', jobId)
    const job = archivedJobs.find(j => j.id === jobId)
    if (job) {
      setArchivedJobs(prev => prev.filter(j => j.id !== jobId))
      setActiveJobs(prev => [{ ...job, is_active: true }, ...prev])
    }
    setLoadingId(null)
  }

  function JobCard({ job, archived = false }: { job: JobWithApplications; archived?: boolean }) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-900">{job.title}</h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              archived ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-700'
            }`}>
              {archived ? 'Archived' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {job.location} · {JOB_TYPE_LABELS[job.type] ?? job.type}
          </p>
          <p className="text-xs text-gray-400">Posted {formatDate(job.created_at)}</p>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 shrink-0">
          {!archived && (
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{job.application_count}</p>
              <p className="text-xs text-gray-400">applicants</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link
              href={`/jobs/${job.id}/applications`}
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              View
            </Link>
            <Link
              href={`/jobs/${job.id}/edit`}
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              Edit
            </Link>
            {archived ? (
              <button
                onClick={() => handleRepost(job.id)}
                disabled={loadingId === job.id}
                className="text-sm border border-green-200 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
              >
                {loadingId === job.id ? '...' : 'Repost'}
              </button>
            ) : null}
            <button
              onClick={() => handleDelete(job.id)}
              disabled={loadingId === job.id}
              className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {loadingId === job.id ? '...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Posted Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your active and archived listings</p>
        </div>
        <Link
          href="/jobs/post"
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Post a job
        </Link>
      </div>

      {/* Active listings */}
      <div className="space-y-3">
        {activeJobs.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-gray-400 text-sm">No active listings.</p>
            <Link href="/jobs/post" className="inline-block text-sm text-blue-600 hover:underline">
              Post your first job →
            </Link>
          </div>
        ) : (
          activeJobs.map(job => <JobCard key={job.id} job={job} />)
        )}
      </div>

      {/* Archived section */}
      {archivedJobs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Archived</h2>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {archivedJobs.map(job => <JobCard key={job.id} job={job} archived />)}
        </div>
      )}

      {/* Recycle bin link */}
      <div className="text-center pt-2">
        <Link href="/recyclebin" className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          🗑 View recycle bin
        </Link>
      </div>
    </div>
  )
}
