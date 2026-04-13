'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  initialQuery?: string
  initialLocation?: string
}

export default function SearchBar({ initialQuery = '', initialLocation = '' }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (location.trim()) params.set('location', location.trim())
    router.push(`/jobs?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className="flex flex-col sm:flex-row gap-0 bg-[#fffefb] rounded-2xl
                 shadow-[0_4px_24px_rgba(28,22,18,0.12)] overflow-hidden
                 ring-1 ring-[#e5d8c8]"
    >
      <div className="flex items-center flex-1 px-4 py-3 gap-3">
        <svg className="w-4 h-4 text-[#a8a29e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Job title, skill, or company"
          className="flex-1 text-sm outline-none text-[#1c1612] placeholder:text-[#a8a29e] bg-transparent"
        />
      </div>

      <div className="hidden sm:block w-px bg-[#e5d8c8] self-stretch my-3" />
      <div className="block sm:hidden h-px bg-[#e5d8c8] mx-4" />

      <div className="flex items-center flex-1 px-4 py-3 gap-3">
        <svg className="w-4 h-4 text-[#a8a29e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11z" />
          <circle cx="12" cy="10" r="2" />
        </svg>
        <input
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Location or Remote"
          className="flex-1 text-sm outline-none text-[#1c1612] placeholder:text-[#a8a29e] bg-transparent"
        />
      </div>

      <div className="p-2">
        <button
          type="submit"
          className="w-full sm:w-auto bg-[#0f2d1f] text-white text-sm font-semibold
                     px-6 py-2.5 rounded-xl hover:bg-[#1a4a32]
                     active:scale-[0.98] transition-all duration-150 whitespace-nowrap"
        >
          Search jobs
        </button>
      </div>
    </form>
  )
}
