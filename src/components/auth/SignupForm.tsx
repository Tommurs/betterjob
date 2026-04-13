'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupForm() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'jobseeker' | 'employer'>('jobseeker')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="text-center space-y-3 py-4">
        <div className="text-4xl">📬</div>
        <h2 className="heading-display text-lg font-semibold text-[#1c1612]">Check your email</h2>
        <p className="text-sm text-[#78716c]">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#1a4a32] transition-colors mt-2">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3">
        {(['jobseeker', 'employer'] as const).map(r => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              role === r
                ? 'bg-[#0f2d1f] text-[#faf6ef] border-[#0f2d1f]'
                : 'bg-[#fffefb] text-[#78716c] border-[#e5d8c8] hover:border-[#cfc0ad]'
            }`}
          >
            {r === 'jobseeker' ? '👤 Job Seeker' : '🏢 Employer'}
          </button>
        ))}
      </div>

      {/* Full name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-[#1c1612] mb-1">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder="Jane Smith"
          className="input"
        />
      </div>

      {/* Email */}
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

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#1c1612] mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          className="input"
        />
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1c1612] mb-1">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="input"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-2.5"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </button>

      {/* Footer */}
      <p className="text-center text-sm text-[#78716c]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0f2d1f] hover:text-[#1a4a32] font-semibold transition-colors">
          Sign in
        </Link>
      </p>
    </form>
  )
}
