'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Toggle from './Toggle'

interface JobPrefs {
  work_arrangements: string[]
  job_types: string[]
  salary_min: number | ''
  salary_max: number | ''
  willing_to_relocate: boolean
}

interface JobPreferencesFormProps {
  userId: string
  initial: Partial<JobPrefs> | null
}

const WORK_ARRANGEMENTS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
]

export default function JobPreferencesForm({ userId, initial }: JobPreferencesFormProps) {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<JobPrefs>({
    work_arrangements: initial?.work_arrangements ?? [],
    job_types: initial?.job_types ?? [],
    salary_min: initial?.salary_min ?? '',
    salary_max: initial?.salary_max ?? '',
    willing_to_relocate: initial?.willing_to_relocate ?? false,
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function toggleArray(key: 'work_arrangements' | 'job_types', value: string) {
    setPrefs(p => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter(v => v !== value)
        : [...p[key], value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    const { error } = await supabase
      .from('profiles')
      .update({ job_preferences: prefs })
      .eq('id', userId)
    setStatus(error ? 'error' : 'success')
    if (!error) setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#1c1612] mb-2.5">Preferred work arrangement</p>
        <div className="flex flex-wrap gap-2">
          {WORK_ARRANGEMENTS.map(opt => {
            const selected = prefs.work_arrangements.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArray('work_arrangements', opt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-[#0f2d1f] text-white border-[#0f2d1f]'
                    : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:bg-[#f2ebe0]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[#1c1612] mb-2.5">Preferred job type</p>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map(opt => {
            const selected = prefs.job_types.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleArray('job_types', opt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-[#0f2d1f] text-white border-[#0f2d1f]'
                    : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:bg-[#f2ebe0]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-[#1c1612] mb-2.5">Desired salary (per year, £)</p>
        <div className="flex items-center gap-3 max-w-xs">
          <input
            type="number"
            min={0}
            value={prefs.salary_min}
            onChange={e =>
              setPrefs(p => ({
                ...p,
                salary_min: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
            placeholder="Min"
            className="input"
          />
          <span className="text-[#a8a29e] text-sm shrink-0">to</span>
          <input
            type="number"
            min={0}
            value={prefs.salary_max}
            onChange={e =>
              setPrefs(p => ({
                ...p,
                salary_max: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
            placeholder="Max"
            className="input"
          />
        </div>
        <p className="text-xs text-[#a8a29e] mt-1.5">
          Used to filter job recommendations. Not shown publicly.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#1c1612]">Willing to relocate</p>
          <p className="text-xs text-[#a8a29e] mt-0.5">
            Show employers that you are open to relocating for the right role.
          </p>
        </div>
        <Toggle
          checked={prefs.willing_to_relocate}
          onChange={v => setPrefs(p => ({ ...p, willing_to_relocate: v }))}
        />
      </div>

      {status === 'success' && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          Job preferences saved.
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
        {status === 'loading' ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  )
}
