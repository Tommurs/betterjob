'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  isSaved: boolean
  isLoggedIn: boolean
  compact?: boolean  // icon-only for use in listing cards
}

export default function SaveJobButton({ jobId, isSaved, isLoggedIn, compact = false }: Props) {
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
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('job_id', jobId)
      setSaved(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        setLoading(false)
        return
      }
      await supabase
        .from('saved_jobs')
        .insert({ job_id: jobId, user_id: user.id })
      setSaved(true)
    }

    setLoading(false)
    router.refresh()
  }

  // Compact: icon-only button for listing cards
  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        title={saved ? 'Unsave job' : 'Save job'}
        className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          saved
            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-red-50 hover:text-red-400 hover:border-red-200'
            : 'bg-white text-gray-400 border-gray-300 hover:text-blue-600 hover:border-blue-400'
        }`}
      >
        {loading ? '·' : '🔖'}
      </button>
    )
  }

  // Full: for job detail page sidebar
  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        saved
          ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      🔖 {loading ? 'Saving...' : saved ? 'Saved' : 'Save job'}
    </button>
  )
}
