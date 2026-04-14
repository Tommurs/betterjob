'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialQ?: string
  initialLocation?: string
  initialSkill?: string
  initialJobTitle?: string
  initialStatus?: string
  initialOpenToWork?: string
}

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Actively looking' },
  { value: 'open', label: 'Open to opportunities' },
  { value: 'not_looking', label: 'Not looking' },
]

export default function CandidateSearchBar({
  initialQ = '',
  initialLocation = '',
  initialSkill = '',
  initialJobTitle = '',
  initialStatus = '',
  initialOpenToWork = '',
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [location, setLocation] = useState(initialLocation)
  const [skill, setSkill] = useState(initialSkill)
  const [jobTitle, setJobTitle] = useState(initialJobTitle)
  const [status, setStatus] = useState(initialStatus)
  const [openToWork, setOpenToWork] = useState(initialOpenToWork === 'true')

  function buildParams(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const values = { q, location, skill, jobTitle, status, openToWork: openToWork ? 'true' : '', ...overrides }
    Object.entries(values).forEach(([k, v]) => { if (v) params.set(k, v) })
    return params.toString()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/jobs?${buildParams()}`)
  }

  return (
    <div className="space-y-4">
      {/* Keyword search bar */}
      <form onSubmit={handleSearch}
        className="flex gap-0 bg-[#fffefb] rounded-2xl shadow-[0_4px_24px_rgba(28,22,18,0.12)]
                   overflow-hidden ring-1 ring-[#e5d8c8]">
        <div className="flex items-center flex-1 px-4 py-3 gap-3">
          <svg className="w-4 h-4 text-[#a8a29e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search by name, headline, or bio"
            className="flex-1 text-sm outline-none text-[#1c1612] placeholder:text-[#a8a29e] bg-transparent"
          />
        </div>
        <div className="p-2">
          <button type="submit"
            className="bg-[#0f2d1f] text-white text-sm font-semibold px-6 py-2.5 rounded-xl
                       hover:bg-[#1a4a32] active:scale-[0.98] transition-all duration-150 whitespace-nowrap">
            Search
          </button>
        </div>
      </form>

      {/* Filters row */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location"
          className="input text-sm max-w-[150px]"
        />
        <input
          type="text"
          value={skill}
          onChange={e => setSkill(e.target.value)}
          placeholder="Skill (exact)"
          className="input text-sm max-w-[140px]"
        />
        <input
          type="text"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder="Job title"
          className="input text-sm max-w-[150px]"
        />
        <label className="flex items-center gap-1.5 text-sm text-[#78716c] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={openToWork}
            onChange={e => setOpenToWork(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#0f2d1f]"
          />
          Open to work
        </label>
        <button type="submit" className="text-xs font-semibold text-[#0f2d1f] hover:text-[#1a4a32] transition-colors px-2">
          Apply
        </button>
      </form>

      {/* Status pill filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => {
          const isActive = status === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setStatus(f.value)
                const params = new URLSearchParams()
                const values = { q, location, skill, jobTitle, openToWork: openToWork ? 'true' : '', status: f.value }
                Object.entries(values).forEach(([k, v]) => { if (v) params.set(k, v) })
                router.push(`/jobs?${params.toString()}`)
              }}
              className={`text-sm px-4 py-1.5 rounded-xl font-semibold border transition-all duration-150 ${
                isActive
                  ? 'bg-[#0f2d1f] text-[#faf6ef] border-[#0f2d1f] shadow-sm'
                  : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad] hover:text-[#1c1612]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
