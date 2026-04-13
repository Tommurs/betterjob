'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  employerId: string
  applicantId: string
}

export default function StartConversationButton({ jobId, employerId, applicantId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)

    // Check if a conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', jobId)
      .eq('employer_id', employerId)
      .eq('applicant_id', applicantId)
      .single()

    if (existing) {
      router.push(`/messages/${existing.id}`)
      return
    }

    // Create a new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({ job_id: jobId, employer_id: employerId, applicant_id: applicantId })
      .select('id')
      .single()

    if (!error && data) {
      router.push(`/messages/${data.id}`)
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-1.5 rounded-xl hover:border-[#cfc0ad] hover:text-[#0f2d1f] transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '✉️ Message'}
    </button>
  )
}
