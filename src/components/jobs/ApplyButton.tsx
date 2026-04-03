'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  hasApplied: boolean
  isLoggedIn: boolean
}

export default function ApplyButton({ jobId, hasApplied, isLoggedIn }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [applied, setApplied] = useState(hasApplied)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('applications')
      .insert({ job_id: jobId })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setApplied(true)
    setLoading(false)
  }

  if (applied) {
    return (
      <div className="w-full text-center py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
        ✓ Application submitted
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Applying...' : isLoggedIn ? 'Apply now' : 'Sign in to apply'}
      </button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
