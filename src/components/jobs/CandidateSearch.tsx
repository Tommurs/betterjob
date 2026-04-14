import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import CandidateCard from './CandidateCard'
import CandidateSearchBar from './CandidateSearchBar'

interface WorkExp {
  id: string
  profile_id: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  is_current: boolean
}

interface Candidate {
  id: string
  full_name: string
  headline: string | null
  bio: string | null
  location: string | null
  skills: string[]
  avatar_url: string | null
  open_to_work: boolean
  job_search_status: string
}

interface Props {
  searchParams: {
    q?: string
    location?: string
    skill?: string
    jobTitle?: string
    status?: string
    openToWork?: string
  }
  employerId: string
}

export default async function CandidateSearch({ searchParams, employerId }: Props) {
  const supabase = createClient()
  const { q, location, skill, jobTitle, status, openToWork } = searchParams

  // Step 1: Job title filter — find matching profile ids from work_experience
  let titleMatchMap: Record<string, WorkExp> = {}
  if (jobTitle) {
    const { data: expMatches } = await supabase
      .from('work_experience')
      .select('id, profile_id, title, company, start_date, end_date, is_current')
      .ilike('title', `%${jobTitle}%`)

    expMatches?.forEach(exp => {
      const existing = titleMatchMap[exp.profile_id]
      if (!existing || (!existing.is_current && exp.is_current)) {
        titleMatchMap[exp.profile_id] = exp
      }
    })
  }

  // Step 2: Build profile query
  let query = supabase
    .from('profiles')
    .select('id, full_name, headline, bio, location, skills, avatar_url, open_to_work, job_search_status')
    .eq('role', 'jobseeker')
    .eq('searchable', true)
    .order('full_name')

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,headline.ilike.%${q}%,bio.ilike.%${q}%`)
  }
  if (location) {
    query = query.ilike('location', `%${location}%`)
  }
  if (skill) {
    query = query.contains('skills', [skill])
  }
  if (status) {
    query = query.eq('job_search_status', status)
  }
  if (openToWork === 'true') {
    query = query.eq('open_to_work', true)
  }
  if (jobTitle) {
    const ids = Object.keys(titleMatchMap)
    if (ids.length === 0) {
      return <EmptyState filtered />
    }
    query = query.in('id', ids)
  }

  const { data: candidates } = await query

  const hasFilters = !!(q || location || skill || jobTitle || status || openToWork)

  return (
    <div className="space-y-6">
      <CandidateSearchBar
        initialQ={q}
        initialLocation={location}
        initialSkill={skill}
        initialJobTitle={jobTitle}
        initialStatus={status}
        initialOpenToWork={openToWork}
      />

      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="heading-display text-xl font-bold text-[#1c1612]">
            {hasFilters ? 'Search results' : 'All Candidates'}
          </h1>
          <p className="text-sm text-[#78716c] mt-0.5">
            {candidates?.length ?? 0} candidate{candidates?.length !== 1 ? 's' : ''}
            {q && <span> matching <strong className="text-[#1c1612]">&quot;{q}&quot;</strong></span>}
          </p>
        </div>
        {hasFilters && (
          <Link href="/jobs" className="text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors font-medium">
            Clear filters ×
          </Link>
        )}
      </div>

      {!candidates || candidates.length === 0 ? (
        <EmptyState filtered={hasFilters} />
      ) : (
        <div className="space-y-3">
          {candidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate as Candidate}
              matchedExperience={jobTitle ? (titleMatchMap[candidate.id] ?? null) : null}
              employerId={employerId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
        <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      </div>
      <p className="text-[#78716c] text-sm font-medium">
        {filtered ? 'No candidates matched your search.' : 'No candidates are currently searchable.'}
      </p>
      {filtered && (
        <Link href="/jobs" className="inline-block text-sm text-[#0f2d1f] font-semibold hover:text-[#166534] transition-colors">
          Clear all filters →
        </Link>
      )}
    </div>
  )
}
