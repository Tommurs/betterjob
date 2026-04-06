'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface DeletedJob {
  id: string
  title: string
  location: string
  type: string
  created_at: string
  deleted_at: string
}

interface Props {
  jobs: DeletedJob[]
}

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract:  'Contract',
  remote:    'Remote',
}

function daysRemaining(deletedAt: string): number {
  const deleted = new Date(deletedAt)
  const now = new Date()
  const daysSince = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, 7 - daysSince)
}

export default function RecycleBin({ jobs: initialJobs }: Props) {
  const supabase = createClient()
  const [jobs, setJobs]       = useState(initialJobs)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleRecover(jobId: string) {
    setLoadingId(jobId)
    await supabase
      .from('job_listings')
      .update({ deleted_at: null, is_active: false })
      .eq('id', jobId)
    setJobs(prev => prev.filter(j => j.id !== jobId))
    setLoadingId(null)
  }

  async function handleDeleteForever(jobId: string) {
    if (!confirm('Permanently delete this listing? This cannot be undone.')) return
    setLoadingId(jobId)
    await supabase.from('job_listings').delete().eq('id', jobId)
    setJobs(prev => prev.filter(j => j.id !== jobId))
    setLoadingId(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Recycle Bin</h1>
          <p className="text-sm text-gray-500 mt-1">Deleted listings are permanently removed after 7 days</p>
        </div>
        <Link
          href="/dashboard"
          className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">🗑</p>
          <p className="text-gray-400 text-sm">Your recycle bin is empty.</p>
          <Link href="/dashboard" className="inline-block text-sm text-blue-600 hover:underline">
            Back to dashboard →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const days = daysRemaining(job.deleted_at)
            return (
              <div
                key={job.id}
                className="bg-white border border-red-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900">{job.title}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-500">
                      Deleted
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {job.location} · {JOB_TYPE_LABELS[job.type] ?? job.type}
                  </p>
                  <p className="text-xs text-gray-400">
                    Posted {formatDate(job.created_at)} · Deleted {formatDate(job.deleted_at)}
                  </p>
                  <p className={`text-xs font-medium ${days <= 1 ? 'text-red-500' : 'text-orange-400'}`}>
                    {days === 0
                      ? 'Purging today'
                      : `Auto-purge in ${days} day${days !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRecover(job.id)}
                    disabled={loadingId === job.id}
                    className="text-sm border border-green-200 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    {loadingId === job.id ? '...' : 'Recover'}
                  </button>
                  <button
                    onClick={() => handleDeleteForever(job.id)}
                    disabled={loadingId === job.id}
                    className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {loadingId === job.id ? '...' : 'Delete forever'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
