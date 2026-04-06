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

const EXP_VALUES = EXPERIENCE_OPTIONS.filter(o => o.value !== '').map(o => o.value)

interface Props {
  companyName: string
}

export default function PostJobForm({ companyName }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle]                   = useState('')
  const [company, setCompany]               = useState(companyName ?? '')
  const [location, setLocation]             = useState('')
  const [type, setType]                     = useState('full_time')
  const [salaryMin, setSalaryMin]           = useState('')
  const [salaryMax, setSalaryMax]           = useState('')
  const [experienceMin, setExperienceMin]   = useState('')
  const [experienceMax, setExperienceMax]   = useState('')
  const [description, setDescription]       = useState('')
  const [requirementInput, setRequirementInput] = useState('')
  const [requirements, setRequirements]     = useState<string[]>([])
  const [submitError, setSubmitError]       = useState('')
  const [loading, setLoading]               = useState(false)

  // --- Inline validation (computed on every render) ---
  const salaryError = (() => {
    if (!salaryMin && !salaryMax) return ''
    if (salaryMin && !salaryMax) return 'Please enter a maximum salary.'
    if (!salaryMin && salaryMax) return 'Please enter a minimum salary.'
    if (Number(salaryMin) > Number(salaryMax))
      return `Minimum ($${Number(salaryMin).toLocaleString()}) cannot exceed maximum ($${Number(salaryMax).toLocaleString()}).`
    return ''
  })()

  const expError = (() => {
    if (!experienceMin || !experienceMax) return ''
    if (EXP_VALUES.indexOf(experienceMin) > EXP_VALUES.indexOf(experienceMax))
      return `Minimum (${experienceMin}) cannot exceed maximum (${experienceMax}).`
    return ''
  })()

  const canSubmit =
    !loading &&
    title.trim() !== '' &&
    company.trim() !== '' &&
    location.trim() !== '' &&
    salaryMin !== '' &&
    salaryMax !== '' &&
    !salaryError &&
    !expError &&
    requirements.length > 0 &&
    description.length >= 50

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
    if (!canSubmit) return
    setSubmitError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitError('You must be signed in to post a job.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('job_listings')
      .insert({
        title,
        company,
        location,
        type,
        salary_min: Number(salaryMin),
        salary_max: Number(salaryMax),
        experience_min: experienceMin || null,
        experience_max: experienceMax || null,
        description,
        requirements,
        is_active: true,
        employer_id: user.id,
      })
      .select('id')
      .single()

    if (error) {
      setSubmitError(error.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${data.id}`)
    router.refresh()
  }

  const baseInput = 'w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
  const inputClass = `${baseInput} border-gray-300`
  const inputErrorClass = `${baseInput} border-red-400 bg-red-50`
  const selectClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white'
  const selectErrorClass = 'w-full px-4 py-2.5 border border-red-400 bg-red-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          className={inputClass}
        />
      </div>

      {/* Company & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business name *</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. New York, NY or Remote"
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
              min={0}
              value={salaryMin}
              onChange={e => setSalaryMin(e.target.value)}
              placeholder="Min"
              className={`pl-7 pr-4 py-2.5 ${salaryError ? inputErrorClass : inputClass}`}
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min={0}
              value={salaryMax}
              onChange={e => setSalaryMax(e.target.value)}
              placeholder="Max"
              className={`pl-7 pr-4 py-2.5 ${salaryError ? inputErrorClass : inputClass}`}
            />
          </div>
        </div>
        {salaryError ? (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{salaryError}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            If the compensation varies too widely to list a specific range, post the most
            representative range you can offer. For significantly different pay tiers,
            consider posting separate listings.
          </p>
        )}
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
              className={expError ? selectErrorClass : selectClass}
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
              className={expError ? selectErrorClass : selectClass}
            >
              {EXPERIENCE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {expError && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{expError}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          rows={6}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the role, responsibilities, team, and what makes it great..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
        <p className={`text-xs mt-1 ${description.length === 0 ? 'text-gray-400' : description.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
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
            placeholder="e.g. 3+ years React experience"
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
        <p className="text-xs text-gray-400 mt-1">Press Enter or click Add after each requirement</p>

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

      {/* Submit error */}
      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {submitError}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 text-white text-sm font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Publishing...' : 'Publish job listing'}
      </button>
    </form>
  )
}
