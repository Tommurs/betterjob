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
        className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          saved
            ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0] hover:bg-red-50 hover:text-red-400 hover:border-red-200'
            : 'bg-[#fffefb] text-[#a8a29e] border-[#e5d8c8] hover:text-[#0f2d1f] hover:border-[#cfc0ad]'
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
      className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        saved
          ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0] hover:bg-red-50 hover:text-red-500 hover:border-red-200'
          : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:text-[#1c1612]'
      }`}
    >
      🔖 {loading ? 'Saving...' : saved ? 'Saved' : 'Save job'}
    </button>
  )
}
