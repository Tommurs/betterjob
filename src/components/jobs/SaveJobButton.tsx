'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  isSaved: boolean
  isLoggedIn: boolean
}

export default function SaveJobButton({ jobId, isSaved, isLoggedIn }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [saved, setSaved] = useState(isSaved)
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoading(true)

    if (saved) {
      await supabase.from('saved_jobs').delete().eq('job_id', jobId)
      setSaved(false)
    } else {
      await supabase.from('saved_jobs').insert({ job_id: jobId })
      setSaved(true)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full text-sm font-medium py-2.5 rounded-lg border transition-colors disabled:opacity-50 ${
        saved
          ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {loading ? '...' : saved ? '🔖 Saved' : '🔖 Save job'}
    </button>
  )
}
