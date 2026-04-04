'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract',  label: 'Contract' },
  { value: 'remote',    label: 'Remote' },
]

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary_min?: number | null
  salary_max?: number | null
  description: string
  requirements: string[]
}

interface Props {
  job: Job
}

export default function EditJobForm({ job }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(job.title)
  const [company, setCompany] = useState(job.company)
  const [location, setLocation] = useState(job.location)
  const [type, setType] = useState(job.type)
  const [salaryMin, setSalaryMin] = useState(job.salary_min?.toString() ?? '')
  const [salaryMax, setSalaryMax] = useState(job.salary_max?.toString() ?? '')
  const [description, setDescription] = useState(job.description)
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements] = useState<string[]>(job.requirements ?? [])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function addRequirement() {
    const trimmed = requirementInput.trim()
    if (trimmed && !requirements.includes(trimmed)) {
      setRequirements(prev => [...prev, trimmed])
      setRequirementInput('')
    }
  }

  function removeRequirement(req: string) {
    setRequirements(prev => prev.filter(r => r !== req))
  }

  function handleRequirementKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRequirement()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (requirements.length === 0) {
      setError('Please add at least one requirement')
      return
    }

    if (description.length < 50) {
      setError('Description must be at least 50 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('job_listings')
      .update({
        title,
        company,
        location,
        type,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        description,
        requirements,
      })
      .eq('id', job.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${job.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Company & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
          <input
            type="text"
            required
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            required
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Job type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Job type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {JOB_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === t.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Salary range <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={salaryMin}
              onChange={e => setSalaryMin(e.target.value)}
              placeholder="Min"
              className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              value={salaryMax}
              onChange={e => setSalaryMax(e.target.value)}
              placeholder="Max"
              className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          required
          rows={6}
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
        <p className={`text-xs mt-1 ${description.length < 50 ? 'text-gray-400' : 'text-green-600'}`}>
          {description.length} / 50 characters minimum
        </p>
      </div>

      {/* Requirements */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={requirementInput}
            onChange={e => setRequirementInput(e.target.value)}
            onKeyDown={handleRequirementKeyDown}
            placeholder="Add a requirement"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button
            type="button"
            onClick={addRequirement}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Add
          </button>
        </div>
        {requirements.length > 0 && (
          <ul className="mt-3 space-y-2">
            {requirements.map(req => (
              <li key={req} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700">
                <span className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>
                  {req}
                </span>
                <button
                  type="button"
                  onClick={() => removeRequirement(req)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-base leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
