'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PasswordForm() {
  const supabase = createClient()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  const valid = next.length >= 8 && next === confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setStatus('loading')
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password: next })
    if (err) {
      setError(err.message)
      setStatus('error')
    } else {
      setStatus('success')
      setCurrent('')
      setNext('')
      setConfirm('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1.5">
          New password
        </label>
        <input
          type="password"
          value={next}
          onChange={e => setNext(e.target.value)}
          placeholder="At least 8 characters"
          className="input"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1.5">
          Confirm new password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Repeat new password"
          className="input"
          autoComplete="new-password"
        />
        {confirm && next !== confirm && (
          <p className="text-xs text-red-500 mt-1.5">Passwords do not match</p>
        )}
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {status === 'success' && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
          Password updated successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={!valid || status === 'loading'}
        className="btn-primary"
      >
        {status === 'loading' ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
