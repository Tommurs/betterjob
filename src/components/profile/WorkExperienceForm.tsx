'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WorkExp {
  id: string
  profile_id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

interface Props {
  profileId: string
  initialExperience: WorkExp[]
}

const EMPTY_FORM = { title: '', company: '', start_date: '', end_date: '', is_current: false }

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function WorkExperienceForm({ profileId, initialExperience }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useState<WorkExp[]>(initialExperience)
  const [form, setForm] = useState(EMPTY_FORM)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase
      .from('work_experience')
      .insert({
        profile_id: profileId,
        title: form.title.trim(),
        company: form.company.trim(),
        start_date: form.start_date + '-01',
        end_date: form.is_current ? null : (form.end_date ? form.end_date + '-01' : null),
        is_current: form.is_current,
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
    } else {
      setEntries(prev =>
        [data, ...prev].sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
      )
      setForm(EMPTY_FORM)
      setAdding(false)
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this experience entry?')) return
    const { error } = await supabase.from('work_experience').delete().eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1c1612]">Work Experience</h3>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-xs font-semibold text-[#0f2d1f] hover:text-[#1a4a32] transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(exp => (
            <div
              key={exp.id}
              className="flex items-start justify-between gap-3 bg-[#f9f5ef] border border-[#e5d8c8] rounded-xl px-4 py-3"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#1c1612]">{exp.title}</p>
                  {exp.is_current && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46]">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#78716c]">{exp.company}</p>
                <p className="text-xs text-[#a8a29e]">
                  {formatMonthYear(exp.start_date)} – {exp.is_current ? 'Present' : formatMonthYear(exp.end_date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(exp.id)}
                className="text-[#a8a29e] hover:text-red-500 transition-colors text-lg leading-none shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !adding && (
        <p className="text-xs text-[#a8a29e]">No experience added yet.</p>
      )}

      {adding && (
        <form onSubmit={handleAdd} className="space-y-3 bg-[#f9f5ef] border border-[#e5d8c8] rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Job title *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Frontend Engineer"
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Company *</label>
              <input
                required
                type="text"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="input text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">Start date *</label>
              <input
                required
                type="month"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1c1612] mb-1">End date</label>
              <input
                type="month"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                disabled={form.is_current}
                className="input text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={e => setForm(f => ({ ...f, is_current: e.target.checked, end_date: '' }))}
              className="w-3.5 h-3.5 accent-[#0f2d1f]"
            />
            <span className="text-xs text-[#1c1612]">I currently work here</span>
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="btn-primary text-xs px-4 py-2">
              {loading ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setForm(EMPTY_FORM); setError('') }}
              className="text-xs text-[#78716c] hover:text-[#1c1612] px-3 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
