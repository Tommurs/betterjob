'use client'

import { useState } from 'react'

export interface ParsedJob {
  title?:          string | null
  company?:        string | null
  location?:       string | null
  type?:           string | null
  salary_min?:     number | null
  salary_max?:     number | null
  experience_min?: string | null
  experience_max?: string | null
  description?:    string | null
  requirements?:   string[]
}

interface Props {
  onParsed: (data: ParsedJob) => void
}

export default function JobParser({ onParsed }: Props) {
  const [open, setOpen]       = useState(false)
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      onParsed(data)
      setSuccess(true)
      setOpen(false)
      setText('')
    } catch {
      setError('Could not reach the parser. Please try again.')
    }

    setLoading(false)
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 overflow-hidden">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setError(''); setSuccess(false) }}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">Auto-fill from existing description</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Paste any job description and we'll fill in the form for you
            </p>
          </div>
        </div>
        <span className="text-blue-400 text-sm font-medium">
          {open ? '▲ Close' : '▼ Open'}
        </span>
      </button>

      {/* Success banner (shown when closed after a successful parse) */}
      {!open && success && (
        <div className="px-5 pb-4">
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            ✓ Fields filled in — review everything below and make any adjustments before publishing.
          </p>
        </div>
      )}

      {/* Expandable body */}
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-blue-100">
          <p className="text-xs text-blue-600 pt-3">
            Paste a job description, a copied listing, or any text describing the role.
            Fields that can be confidently detected will be filled in automatically.
          </p>
          <textarea
            rows={8}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your existing job description here..."
            className="w-full px-4 py-3 border border-blue-200 bg-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
          />
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Parsing...' : 'Parse & fill form'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError('') }}
              className="text-sm text-blue-500 hover:text-blue-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
