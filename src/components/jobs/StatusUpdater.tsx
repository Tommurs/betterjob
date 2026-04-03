'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const STATUSES = [
  { value: 'pending',     label: 'Pending' },
  { value: 'reviewing',   label: 'Under Review' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'offered',     label: 'Offer Received' },
  { value: 'rejected',    label: 'Not Selected' },
]

interface Props {
  applicationId: string
  currentStatus: string
}

export default function StatusUpdater({ applicationId, currentStatus }: Props) {
  const supabase = createClient()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleChange(newStatus: string) {
    setStatus(newStatus)
    setSaved(false)
    setLoading(true)

    await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', applicationId)

    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {saved && <span className="text-xs text-green-600">✓ Saved</span>}
    </div>
  )
}
