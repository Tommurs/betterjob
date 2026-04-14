'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SECTORS } from '@/lib/constants/sectors'

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

const DEGREE_OPTIONS = [
  { value: '',             label: 'Not specified' },
  { value: 'none',         label: 'No formal education required' },
  { value: 'high_school',  label: 'High School Diploma / GED' },
  { value: 'trade',        label: 'Trade / Vocational Certificate' },
  { value: 'associate',    label: "Associate's Degree" },
  { value: 'bachelor',     label: "Bachelor's Degree" },
  { value: 'master',       label: "Master's Degree" },
  { value: 'doctorate',    label: 'Doctorate / PhD' },
  { value: 'professional', label: 'Professional Degree (JD, MD, etc.)' },
]

const EXP_VALUES = EXPERIENCE_OPTIONS.filter(o => o.value !== '').map(o => o.value)

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
  required_degree?: string | null
  preferred_degree?: string | null
  preferred_qualifications?: string[]
  fresh_grad_policy?: string | null
  messaging_enabled?: boolean
  sector?: string | null
}

interface Props {
  job: Job
}

export default function EditJobForm({ job }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle]                         = useState(job.title)
  const [company, setCompany]                     = useState(job.company)
  const [location, setLocation]                   = useState(job.location)
  const [type, setType]                           = useState(job.type)
  const [salaryMin, setSalaryMin]                 = useState(job.salary_min?.toString() ?? '')
  const [salaryMax, setSalaryMax]                 = useState(job.salary_max?.toString() ?? '')
  const [experienceMin, setExperienceMin]         = useState(job.experience_min ?? '')
  const [experienceMax, setExperienceMax]         = useState(job.experience_max ?? '')
  const [description, setDescription]             = useState(job.description)
  const [requirementInput, setRequirementInput]   = useState('')
  const [requirements, setRequirements]           = useState<string[]>(job.requirements ?? [])
  const [requiredDegree, setRequiredDegree]       = useState(job.required_degree ?? '')
  const [preferredDegree, setPreferredDegree]     = useState(job.preferred_degree ?? '')
  const [preferredInput, setPreferredInput]       = useState('')
  const [preferredQuals, setPreferredQuals]       = useState<string[]>(job.preferred_qualifications ?? [])
  const [freshGradPolicy, setFreshGradPolicy]     = useState<'no' | 'fresh_grad' | 'fresh_grad_plus'>(
    (job.fresh_grad_policy as 'fresh_grad' | 'fresh_grad_plus') ?? 'no'
  )
  const [sector, setSector]                       = useState(job.sector ?? '')
  const [messagingEnabled, setMessagingEnabled]   = useState(job.messaging_enabled ?? false)
  const [submitError, setSubmitError]             = useState('')
  const [loading, setLoading]                     = useState(false)

  // --- Inline validation ---
  const salaryError = (() => {
    if (!salaryMin && !salaryMax) return ''
    if (salaryMin && !salaryMax) return 'Please enter a maximum salary.'
    if (!salaryMin && salaryMax) return 'Please enter a minimum salary.'
    if (Number(salaryMin) > Number(salaryMax))
      return `Minimum ($${Number(salaryMin).toLocaleString()}) cannot exceed maximum ($${Number(salaryMax).toLocaleString()}).`
    return ''
  })()

  const expError = (() => {
    if (!experienceMin && !experienceMax) return 'Please select a years of experience range.'
    if (experienceMin && !experienceMax) return 'Please select a maximum years of experience.'
    if (!experienceMin && experienceMax) return 'Please select a minimum years of experience.'
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
    experienceMin !== '' &&
    experienceMax !== '' &&
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

  function addPreferred() {
    const trimmed = preferredInput.trim()
    if (trimmed && !preferredQuals.includes(trimmed)) {
      setPreferredQuals(prev => [...prev, trimmed])
      setPreferredInput('')
    }
  }

  function removePreferred(q: string) {
    setPreferredQuals(prev => prev.filter(r => r !== q))
  }

  function handleKeyDown(fn: () => void) {
    return (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); fn() }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitError('')
    setLoading(true)

    const { error } = await supabase
      .from('job_listings')
      .update({
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
        required_degree: requiredDegree || null,
        preferred_degree: preferredDegree || null,
        preferred_qualifications: preferredQuals,
        fresh_grad_policy: freshGradPolicy === 'no' ? null : freshGradPolicy,
        messaging_enabled: messagingEnabled,
        sector: sector || null,
      })
      .eq('id', job.id)

    if (error) {
      setSubmitError(error.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${job.id}`)
    router.refresh()
  }

  const inputClass    = 'input'
  const inputErrClass = 'w-full px-4 py-2.5 border border-red-400 bg-red-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'
  const selectClass   = 'input bg-white'
  const selectErrClass= 'w-full px-4 py-2.5 border border-red-400 bg-red-50 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition'

  function QualList({
    items, onRemove, input, setInput, onAdd, placeholder,
  }: {
    items: string[]; onRemove: (s: string) => void
    input: string; setInput: (s: string) => void
    onAdd: () => void; placeholder: string
  }) {
    return (
      <>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown(onAdd)}
            placeholder={placeholder}
            className="flex-1 px-4 py-2.5 border border-[#e5d8c8] rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <button type="button" onClick={onAdd}
            className="px-4 py-2.5 bg-gray-100 text-[#1c1612] text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Add
          </button>
        </div>
        <p className="text-xs text-[#a8a29e] mt-1">Press Enter or click Add after each item</p>
        {items.length > 0 && (
          <ul className="mt-3 space-y-2">
            {items.map(item => (
              <li key={item} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-[#1c1612]">
                <span className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span>{item}
                </span>
                <button type="button" onClick={() => onRemove(item)}
                  className="text-[#a8a29e] hover:text-red-500 transition-colors text-base leading-none">×</button>
              </li>
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1">Job title *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} />
      </div>

      {/* Company & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#1c1612] mb-1">Business name *</label>
          <input type="text" value={company} onChange={e => setCompany(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1c1612] mb-1">Location *</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Job type */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-2">Job type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {JOB_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => setType(t.value)}
              className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                type === t.value ? 'bg-[#0f2d1f] text-white border-[#0f2d1f]' : 'bg-white text-gray-600 border-[#e5d8c8] hover:border-[#a7f3d0]'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sector */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1">
          Industry / Sector
          <span className="text-[#a8a29e] font-normal ml-1">(optional)</span>
        </label>
        <select
          value={sector}
          onChange={e => setSector(e.target.value)}
          className="input bg-white"
        >
          <option value="">Select a sector…</option>
          {SECTORS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <p className="text-xs text-[#a8a29e] mt-1">
          This can differ from your company sector — useful for recruiting firms posting on behalf of a client.
        </p>
      </div>

      {/* Salary */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1">Salary range *</label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e] text-sm">$</span>
            <input type="number" min={0} value={salaryMin} onChange={e => setSalaryMin(e.target.value)}
              placeholder="Min" className={`pl-7 pr-4 py-2.5 ${salaryError ? inputErrClass : inputClass}`} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29e] text-sm">$</span>
            <input type="number" min={0} value={salaryMax} onChange={e => setSalaryMax(e.target.value)}
              placeholder="Max" className={`pl-7 pr-4 py-2.5 ${salaryError ? inputErrClass : inputClass}`} />
          </div>
        </div>
        {salaryError ? (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{salaryError}</p>
        ) : (
          <p className="text-xs text-[#a8a29e] mt-2 leading-relaxed">
            If the compensation varies too widely to list a specific range, post the most representative
            range you can offer. For significantly different pay tiers, consider posting separate listings.
          </p>
        )}
      </div>

      {/* Years of experience */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-2">Years of experience *</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#78716c] mb-1">Minimum</label>
            <select value={experienceMin} onChange={e => setExperienceMin(e.target.value)}
              className={expError ? selectErrClass : selectClass}>
              {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#78716c] mb-1">Maximum</label>
            <select value={experienceMax} onChange={e => setExperienceMax(e.target.value)}
              className={expError ? selectErrClass : selectClass}>
              {EXPERIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {expError && <p className="text-xs text-red-600 mt-1.5 font-medium">{expError}</p>}
      </div>

      {/* Fresh graduate policy */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-2">Open to fresh graduates?</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'no',              label: 'No' },
            { value: 'fresh_grad',      label: 'Fresh Graduate' },
            { value: 'fresh_grad_plus', label: 'Fresh Grad + Experience' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFreshGradPolicy(opt.value)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                freshGradPolicy === opt.value
                  ? 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'
                  : 'bg-white text-gray-600 border-[#e5d8c8] hover:border-[#a7f3d0]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#a8a29e] mt-1.5">
          {freshGradPolicy === 'fresh_grad'      && 'Listing will show a "Fresh Graduate" tag — no prior experience needed.'}
          {freshGradPolicy === 'fresh_grad_plus' && 'Listing will show a "Fresh Grad + Experience" tag — open to fresh grads with some relevant background.'}
          {freshGradPolicy === 'no'              && 'No fresh graduate tag will be shown on the listing.'}
        </p>
      </div>

      {/* Applicant messaging */}
      <div className="flex items-start justify-between gap-4 bg-[#faf6ef] border border-[#e5d8c8] rounded-xl px-4 py-3.5">
        <div>
          <p className="text-sm font-medium text-[#1c1612]">Allow applicants to message you</p>
          <p className="text-xs text-[#78716c] mt-0.5">Applicants who have applied can send you a message about this role</p>
        </div>
        <button
          type="button"
          onClick={() => setMessagingEnabled(v => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
            messagingEnabled ? 'bg-[#0f2d1f]' : 'bg-[#d6cdc4]'
          }`}
          role="switch"
          aria-checked={messagingEnabled}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            messagingEnabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#1c1612] mb-1">Description *</label>
        <textarea rows={6} value={description} onChange={e => setDescription(e.target.value)}
          className="input resize-none" />
        <p className={`text-xs mt-1 ${description.length === 0 ? 'text-[#a8a29e]' : description.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
          {description.length} / 50 characters minimum
        </p>
      </div>

      {/* Required qualifications */}
      <div className="space-y-4 border border-gray-200 rounded-xl p-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Required qualifications *</h3>
          <p className="text-xs text-[#a8a29e] mt-0.5">Qualifications a candidate must have to be considered</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Education / Degree</label>
          <select value={requiredDegree} onChange={e => setRequiredDegree(e.target.value)} className={selectClass}>
            {DEGREE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Other requirements</label>
          <QualList items={requirements} onRemove={removeRequirement}
            input={requirementInput} setInput={setRequirementInput}
            onAdd={addRequirement} placeholder="e.g. 3+ years React experience" />
        </div>
      </div>

      {/* Preferred qualifications */}
      <div className="space-y-4 border border-gray-200 rounded-xl p-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Preferred qualifications</h3>
          <p className="text-xs text-[#a8a29e] mt-0.5">Nice-to-haves that would make a candidate stand out</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Education / Degree</label>
          <select value={preferredDegree} onChange={e => setPreferredDegree(e.target.value)} className={selectClass}>
            {DEGREE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Other preferred qualifications</label>
          <QualList items={preferredQuals} onRemove={removePreferred}
            input={preferredInput} setInput={setPreferredInput}
            onAdd={addPreferred} placeholder="e.g. Experience with GraphQL" />
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {submitError}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!canSubmit}
          className="bg-[#0f2d1f] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[#1a4a32] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm text-[#78716c] hover:text-[#1c1612] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
