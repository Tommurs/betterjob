'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  isActive: boolean
}

export default function EmployerJobActions({ jobId, isActive }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggleActive() {
    setLoading(true)
    await supabase
      .from('job_listings')
      .update({ is_active: !isActive })
      .eq('id', jobId)
    router.refresh()
    setLoading(false)
  }

  async function deleteJob() {
    if (!confirm('Move this listing to the recycle bin? It will be permanently deleted after 7 days.')) return
    setLoading(true)
    await supabase
      .from('job_listings')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', jobId)
    router.push('/dashboard')
  }

  return (
    <div className="space-y-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`w-full text-sm font-medium py-2.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isActive
            ? 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
        }`}
      >
        {loading ? '...' : isActive ? '⏸ Close listing' : '▶ Reopen listing'}
      </button>
      <button
        onClick={deleteJob}
        disabled={loading}
        className="w-full text-sm font-medium py-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        🗑 Delete listing
      </button>
    </div>
  )
}
