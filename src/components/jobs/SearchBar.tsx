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
      className="flex flex-col sm:flex-row gap-3 bg-white border border-gray-200 rounded-xl p-2 shadow-sm max-w-2xl mx-auto"
    >
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Job title, skill, or company"
        className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 placeholder-gray-400"
      />
      <input
        type="text"
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Location or Remote"
        className="flex-1 px-4 py-2 text-sm outline-none text-gray-700 placeholder-gray-400 sm:border-l border-gray-200"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white text-sm font-medium px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </form>
  )
}
