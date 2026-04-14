'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  employerId: string
  candidateId: string
}

export default function CandidateMessageButton({ employerId, candidateId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [insertError, setInsertError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .is('job_id', null)
        .eq('employer_id', employerId)
        .eq('applicant_id', candidateId)
        .single()

      if (existing) {
        router.push(`/messages/${existing.id}`)
        return
      }

      const { data, error: err } = await supabase
        .from('conversations')
        .insert({ employer_id: employerId, applicant_id: candidateId })
        .select('id')
        .single()

      if (err) {
        setInsertError('Could not start conversation. Please try again.')
        return
      }
      if (data) {
        router.push(`/messages/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label="Message candidate"
        className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-2 rounded-xl
                   hover:border-[#cfc0ad] hover:text-[#0f2d1f] transition-colors disabled:opacity-50"
      >
        {loading ? '…' : 'Message'}
      </button>
      {insertError && (
        <p className="text-xs text-red-500 mt-1">{insertError}</p>
      )}
    </div>
  )
}
