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
      <div className="w-full text-center py-2.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
        ✓ Application submitted
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleApplyClick}
        className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Apply now
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
          />

          {/* Modal card */}
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 space-y-5">
            {/* Header */}
            <div>
              <h2 className="text-lg font-bold text-gray-900">Apply for this role</h2>
              <p className="text-sm text-gray-500 mt-0.5">{jobTitle} · {company}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cover letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover letter
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  rows={6}
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  placeholder={`Tell ${company} why you're a great fit for this role...`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {coverLetter.length} characters
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit application'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
