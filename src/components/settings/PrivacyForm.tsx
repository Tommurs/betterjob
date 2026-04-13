'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toggle from './Toggle'

interface PrivacyFormProps {
  userId: string
  role: string
  profileVisibility: string
  openToWork: boolean
  inviteToApply: boolean
  jobSearchStatus: string
}

export default function PrivacyForm({
  userId,
  role,
  profileVisibility: initialVisibility,
  openToWork: initialOpenToWork,
  inviteToApply: initialInviteToApply,
  jobSearchStatus: initialJobSearchStatus,
}: PrivacyFormProps) {
  const supabase = createClient()
  const [visibility, setVisibility] = useState(initialVisibility || 'public')
  const [openToWork, setOpenToWork] = useState(initialOpenToWork ?? false)
  const [inviteToApply, setInviteToApply] = useState(initialInviteToApply ?? true)
  const [jobSearchStatus, setJobSearchStatus] = useState(initialJobSearchStatus || 'open')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const isJobseeker = role !== 'employer'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase
      .from('profiles')
      .update({
        profile_visibility: visibility,
        ...(isJobseeker && {
          open_to_work: openToWork,
          invite_to_apply: inviteToApply,
          job_search_status: jobSearchStatus,
        }),
      })
      .eq('id', userId)
    setStatus(error ? 'error' : 'success')
    if (!error) setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1.5">
          Profile visibility
        </label>
        <select
          value={visibility}
          onChange={e => setVisibility(e.target.value)}
          className="input max-w-xs"
        >
          <option value="public">Public — visible to everyone</option>
          <option value="employers_only">Employers only — hidden from other job seekers</option>
          <option value="private">Private — only visible to you</option>
        </select>
        <p className="text-xs text-[#a8a29e] mt-1.5">
          Controls who can view your full profile page.
        </p>
      </div>

      {isJobseeker && (
        <>
          <div>
            <label className="block text-sm font-medium text-[#1c1612] mb-1.5">
              Job search status
            </label>
            <select
              value={jobSearchStatus}
              onChange={e => setJobSearchStatus(e.target.value)}
              className="input max-w-xs"
            >
              <option value="active">Actively looking</option>
              <option value="open">Open to opportunities</option>
              <option value="not_looking">Not looking right now</option>
            </select>
            <p className="text-xs text-[#a8a29e] mt-1.5">
              Lets employers know how actively you are searching.
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 py-0.5">
            <div>
              <p className="text-sm font-medium text-[#1c1612]">Open to Work</p>
              <p className="text-xs text-[#a8a29e] mt-0.5">
                Show a visible badge on your profile that you are open to new roles.
              </p>
            </div>
            <Toggle checked={openToWork} onChange={setOpenToWork} />
          </div>

          <div className="flex items-start justify-between gap-4 py-0.5">
            <div>
              <p className="text-sm font-medium text-[#1c1612]">Invite to Apply</p>
              <p className="text-xs text-[#a8a29e] mt-0.5">
                Allow employers to proactively invite you to apply for their open roles.
              </p>
            </div>
            <Toggle checked={inviteToApply} onChange={setInviteToApply} />
          </div>
        </>
      )}

      {status === 'success' && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          Privacy settings saved.
        </p>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary"
      >
        {status === 'loading' ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}
