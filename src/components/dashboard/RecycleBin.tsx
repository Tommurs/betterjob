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
          <h1 className="heading-display text-xl font-bold text-[#1c1612]">Recycle Bin</h1>
          <p className="text-sm text-[#78716c] mt-1">Deleted listings are permanently removed after 7 days</p>
        </div>
        <Link
          href="/dashboard"
          className="btn-secondary text-sm px-4 py-2"
        >
          ← Back to dashboard
        </Link>
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </div>
          <p className="text-[#a8a29e] text-sm">Your recycle bin is empty.</p>
          <Link href="/dashboard" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#1a4a32] transition-colors">
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
                className="bg-[#fffefb] border border-red-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-[#1c1612]">{job.title}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-red-50 text-red-500">
                      Deleted
                    </span>
                  </div>
                  <p className="text-sm text-[#78716c]">
                    {job.location} · {JOB_TYPE_LABELS[job.type] ?? job.type}
                  </p>
                  <p className="text-xs text-[#a8a29e]">
                    Posted {formatDate(job.created_at)} · Deleted {formatDate(job.deleted_at)}
                  </p>
                  <p className={`text-xs font-medium ${days <= 1 ? 'text-red-500' : 'text-[#d97706]'}`}>
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
                    className="text-sm border border-[#a7f3d0] text-[#065f46] px-4 py-2 rounded-xl
                               hover:bg-[#d1fae5] transition-colors disabled:opacity-50"
                  >
                    {loadingId === job.id ? '...' : 'Recover'}
                  </button>
                  <button
                    onClick={() => handleDeleteForever(job.id)}
                    disabled={loadingId === job.id}
                    className="text-sm border border-red-200 text-red-500 px-4 py-2 rounded-xl
                               hover:bg-red-50 transition-colors disabled:opacity-50"
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
