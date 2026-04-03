'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  role: string
  full_name: string
  headline?: string
  bio?: string
  location?: string
  website?: string
  linkedin_url?: string
  github_url?: string
  skills?: string[]
}

interface Props {
  profile: Profile | null
}

export default function ProfileForm({ profile }: Props) {
  const supabase = createClient()
  const isEmployer = profile?.role === 'employer'

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [headline, setHeadline] = useState(profile?.headline ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [location, setLocation] = useState(profile?.location ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [linkedin, setLinkedin] = useState(profile?.linkedin_url ?? '')
  const [github, setGithub] = useState(profile?.github_url ?? '')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? [])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function addSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed])
      setSkillInput('')
    }
  }

  function removeSkill(skill: string) {
    setSkills(prev => prev.filter(s => s !== skill))
  }

  function handleSkillKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        headline,
        bio,
        location,
        website,
        linkedin_url: linkedin,
        github_url: github,
        skills,
      })
      .eq('id', profile?.id)

    if (error) {
      setError(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Avatar placeholder */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center">
          {fullName.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{fullName || 'Your name'}</p>
          <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Full name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEmployer ? 'Company name' : 'Full name'} *
        </label>
        <input
          type="text"
          required
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          placeholder={isEmployer ? 'e.g. Acme Corp' : 'e.g. Jane Smith'}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEmployer ? 'Company tagline' : 'Headline'}
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={e => setHeadline(e.target.value)}
          placeholder={isEmployer ? 'e.g. Building the future of logistics' : 'e.g. Frontend Engineer · React · TypeScript'}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isEmployer ? 'About the company' : 'About you'}
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          rows={4}
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder={isEmployer
            ? 'Tell candidates what your company does, your mission, and culture...'
            : 'Tell employers about yourself, your experience, and what you\'re looking for...'}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Location & Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. New York, NY"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Social links — job seekers only */}
      {!isEmployer && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
            <input
              type="url"
              value={linkedin}
              onChange={e => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/you"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
            <input
              type="url"
              value={github}
              onChange={e => setGithub(e.target.value)}
              placeholder="https://github.com/you"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>
      )}

      {/* Skills — job seekers only */}
      {!isEmployer && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="e.g. React, Python, Figma..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Press Enter or click Add after each skill</p>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map(skill => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-400 hover:text-red-500 transition-colors text-base leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">✓ Profile saved</span>
        )}
      </div>
    </form>
  )
}
