'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password/update`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-4xl">📬</div>
        <h2 className="heading-display text-lg font-semibold text-[#1c1612]">Check your email</h2>
        <p className="text-sm text-[#78716c]">
          We sent a reset link to <strong>{email}</strong>. Click it to choose a new password.
        </p>
        <Link href="/login" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#1a4a32] transition-colors mt-2">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#1c1612] mb-1">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>

      <p className="text-center text-sm text-[#78716c]">
        Remembered it?{' '}
        <Link href="/login" className="text-[#0f2d1f] hover:text-[#1a4a32] font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
