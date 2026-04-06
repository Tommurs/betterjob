'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const JOB_TYPES = [
  { value: 'full_time',  label: 'Full-time' },
  { value: 'part_time',  label: 'Part-time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'temporary',  label: 'Temporary' },
]

const EXPERIENCE_OPTIONS = [
  { value: '',          label: 'Not specified' },
  { value: '6 months',  label: '6 months+' },
  { value: '1 year',    label: '1 year' },
  { value: '2 years',   label: '2 years' },
  { value: '3 years',   label: '3 years' },
  { value: '4 years',   label: '4 years' },
  { value: '5 years',   label: '5 years' },
  { value: '6 years',   label: '6 years' },
  { value: '7 years',   label: '7 years' },
  { value: '8 years',   label: '8 years' },
  { value: '9 years',   label: '9 years' },
  { value: '10 years',  label: '10 years' },
  { value: '11 years',  label: '11 years' },
  { value: '12 years',  label: '12 years' },
  { value: '13 years',  label: '13 years' },
  { value: '14 years',  label: '14 years' },
  { value: '15+ years', label: '15+ years' },
]

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary_min?: number | null
  salary_max?: number | null
  experience_min?: string | null
  experience_max?: string | null
  description: string
  requirements: string[]
}

interface Props {
  job: Job
}

export default function EditJobForm({ job }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle]                 = useState(job.title)
  const [company, setCompany]             = useState(job.company)
  const [location, setLocation]           = useState(job.location)
  const [type, setType]                   = useState(job.type)
  const [salaryMin, setSalaryMin]         = useState(job.salary_min?.toString() ?? '')
  const [salaryMax, setSalaryMax]         = useState(job.salary_max?.toString() ?? '')
  const [experienceMin, setExperienceMin] = useState(job.experience_min ?? '')
  const [experienceMax, setExperienceMax] = useState(job.experience_max ?? '')
  const [description, setDescription]     = useState(job.description)
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements]   = useState<string[]>(job.requirements ?? [])
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)

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

    if (!salaryMin || !salaryMax) {
      setError('Please provide both a minimum and maximum salary.')
      return
    }

    if (parseInt(salaryMin) > parseInt(salaryMax)) {
      setError('The minimum salary ($' + parseInt(salaryMin).toLocaleString() + ') cannot be greater than the maximum ($' + parseInt(salaryMax).toLocaleString() + '). Please correct the salary range.')
      return
    }

    if (experienceMin && experienceMax) {
      const expValues = EXPERIENCE_OPTIONS.filter(o => o.value !== '').map(o => o.value)
      if (expValues.indexOf(experienceMin) > expValues.indexOf(experienceMax)) {
        setError(`The minimum experience (${experienceMin}) cannot be greater than the maximum (${experienceMax}). Please correct the experience range.`)
        return
      }
    }

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
        salary_min: parseInt(salaryMin),
        salary_max: parseInt(salaryMax),
        experience_min: experienceMin || null,
        experience_max: experienceMax || null,
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

  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
  const selectClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'

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
          className={inputClass}
        />
      </div>

      {/* Company & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
          <input
            type="text"
            required
            value={company}
            onChange={e => setCompany(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            required
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={inputClass}
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Salary range *</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              required
              min={0}
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
              required
              min={0}
              value={salaryMax}
              onChange={e => setSalaryMax(e.target.value)}
              placeholder="Max"
              className="w-full pl-7 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          If the compensation for this role varies too widely to list a specific range, post the most
          representative range you can offer. For roles with significantly different pay tiers,
          consider posting them as separate listings.
        </p>
      </div>

      {/* Years of experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Years of experience</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum</label>
            <select
              value={experienceMin}
              onChange={e => setExperienceMin(e.target.value)}
              className={selectClass}
            >
              {EXPERIENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum</label>
            <select
              value={experienceMax}
              onChange={e => setExperienceMax(e.target.value)}
              className={selectClass}
            >
              {EXPERIENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
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
