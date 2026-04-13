'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  savedId: string
}

export default function UnsaveButton({ savedId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleUnsave() {
    setLoading(true)
    await supabase.from('saved_jobs').delete().eq('id', savedId)
    router.refresh()
  }

  return (
    <button
      onClick={handleUnsave}
      disabled={loading}
      className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-2 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '🔖 Unsave'}
    </button>
  )
}
