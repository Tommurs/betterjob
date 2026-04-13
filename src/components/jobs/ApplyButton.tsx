'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  jobId: string
  jobTitle: string
  company: string
  hasApplied: boolean
  isLoggedIn: boolean
}

export default function ApplyButton({ jobId, jobTitle, company, hasApplied, isLoggedIn }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [applied, setApplied] = useState(hasApplied)
  const [showModal, setShowModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleApplyClick() {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        cover_letter: coverLetter.trim() || null,
      })

    if (error) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setApplied(true)
    setShowModal(false)
    setLoading(false)
    router.refresh()
  }

  if (applied) {
    return (
      <div className="w-full text-center py-2.5 rounded-xl bg-[#d1fae5] text-[#065f46] text-sm font-semibold">
        ✓ Application submitted
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleApplyClick}
        className="btn-primary w-full py-2.5"
      >
        Apply now
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#1c1612]/50"
            onClick={() => setShowModal(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-lg bg-[#fffefb] border border-[#e5d8c8] rounded-2xl
                          shadow-[0_8px_40px_rgba(28,22,18,0.15)] p-6 space-y-5">
            {/* Header */}
            <div>
              <h2 className="heading-display text-lg font-bold text-[#1c1612]">Apply for this role</h2>
              <p className="text-sm text-[#78716c] mt-0.5">{jobTitle} · {company}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cover letter */}
              <div>
                <label className="block text-sm font-medium text-[#1c1612] mb-1">
                  Cover letter
                  <span className="text-[#a8a29e] font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  rows={6}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder={`Tell ${company} why you're a great fit for this role...`}
                  className="input resize-none"
                />
                <p className="text-xs text-[#a8a29e] mt-1">
                  {coverLetter.length} characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-2.5"
                >
                  {loading ? 'Submitting...' : 'Submit application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-5 py-2.5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
