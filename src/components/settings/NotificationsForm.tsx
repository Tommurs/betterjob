'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toggle from './Toggle'

interface NotificationPrefs {
  messages: boolean
  application_updates: boolean
  job_recommendations: boolean
  new_applications: boolean
  weekly_digest: boolean
  marketing: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  messages: true,
  application_updates: true,
  job_recommendations: true,
  new_applications: true,
  weekly_digest: false,
  marketing: false,
}

interface NotificationsFormProps {
  userId: string
  role: string
  initial: Partial<NotificationPrefs> | null
}

export default function NotificationsForm({ userId, role, initial }: NotificationsFormProps) {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<NotificationPrefs>({ ...DEFAULT_PREFS, ...initial })
  const [saving, setSaving] = useState<string | null>(null)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  async function toggle(key: keyof NotificationPrefs) {
    const newPrefs = { ...prefs, [key]: !prefs[key] }
    setPrefs(newPrefs)
    setSaving(key)
    await supabase
      .from('profiles')
      .update({ notification_preferences: newPrefs })
      .eq('id', userId)
    setSaving(null)
    setSavedKey(key)
    setTimeout(() => setSavedKey(null), 2000)
  }

  const isJobseeker = role !== 'employer'

  const rows: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    {
      key: 'messages',
      label: 'New messages',
      desc: 'When someone sends you a message',
    },
    ...(isJobseeker
      ? [
          {
            key: 'application_updates' as const,
            label: 'Application updates',
            desc: 'When an employer reviews or changes your application status',
          },
          {
            key: 'job_recommendations' as const,
            label: 'Job recommendations',
            desc: 'Personalised job suggestions based on your profile and preferences',
          },
        ]
      : [
          {
            key: 'new_applications' as const,
            label: 'New applications',
            desc: 'When a candidate applies to one of your listings',
          },
        ]),
    {
      key: 'weekly_digest',
      label: 'Weekly digest',
      desc: 'A weekly summary of activity on your account',
    },
    {
      key: 'marketing',
      label: 'Marketing emails',
      desc: 'Product updates, tips, and promotional content from BetterJob',
    },
  ]

  return (
    <div className="divide-y divide-slate-100">
      {rows.map(row => (
        <div key={row.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div className="pr-4">
            <p className="text-sm font-medium text-slate-800">{row.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{row.desc}</p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {savedKey === row.key && (
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            )}
            <Toggle
              checked={prefs[row.key]}
              onChange={() => toggle(row.key)}
              disabled={saving === row.key}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
