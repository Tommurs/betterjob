import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CandidateMessageButton from '@/components/messages/CandidateMessageButton'

function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: viewer } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (viewer?.role !== 'employer') redirect('/jobs')

  const [{ data: candidate }, { data: experience }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, headline, bio, location, skills, avatar_url, open_to_work, job_search_status, linkedin_url, github_url')
      .eq('id', params.id)
      .eq('role', 'jobseeker')
      .eq('searchable', true)
      .single(),
    supabase
      .from('work_experience')
      .select('*')
      .eq('profile_id', params.id)
      .order('start_date', { ascending: false }),
  ])

  if (!candidate) notFound()

  const initials = candidate.full_name
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const JOB_SEARCH_LABELS: Record<string, string> = {
    active: 'Actively looking',
    open: 'Open to opportunities',
    not_looking: 'Not looking',
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/jobs" className="text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors">
          ← Back to candidates
        </Link>
      </div>

      {/* Header */}
      <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                      shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="flex items-start gap-5">
          {candidate.avatar_url ? (
            <img
              src={candidate.avatar_url}
              alt={candidate.full_name}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-2xl font-bold
                            flex items-center justify-center shrink-0">
              {initials}
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="heading-display text-xl font-bold text-[#1c1612]">{candidate.full_name}</h1>
              {candidate.open_to_work && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]">
                  Open to work
                </span>
              )}
            </div>
            {candidate.headline && <p className="text-sm text-[#78716c]">{candidate.headline}</p>}
            {candidate.location && <p className="text-xs text-[#a8a29e]">{candidate.location}</p>}
            {candidate.job_search_status && (
              <p className="text-xs text-[#a8a29e]">{JOB_SEARCH_LABELS[candidate.job_search_status]}</p>
            )}
          </div>

          <CandidateMessageButton employerId={user.id} candidateId={candidate.id} />
        </div>
      </div>

      {/* About */}
      {candidate.bio && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">About</h2>
          <p className="text-sm text-[#78716c] whitespace-pre-line">{candidate.bio}</p>
        </div>
      )}

      {/* Work Experience */}
      {experience && experience.length > 0 && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-4">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp: any) => (
              <div key={exp.id} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0f2d1f] mt-2 shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#1c1612]">{exp.title}</p>
                    {exp.is_current && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46]">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#78716c]">{exp.company}</p>
                  <p className="text-xs text-[#a8a29e] mt-0.5">
                    {formatMonthYear(exp.start_date)} – {exp.is_current ? 'Present' : formatMonthYear(exp.end_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {candidate.skills && candidate.skills.length > 0 && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill: string) => (
              <span
                key={skill}
                className="text-xs px-3 py-1.5 rounded-full bg-[#f2ebe0] text-[#0f2d1f] border border-[#e5d8c8] font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      {(candidate.linkedin_url || candidate.github_url) && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <h2 className="text-sm font-semibold text-[#1c1612] mb-3">Links</h2>
          <div className="flex flex-col gap-2">
            {candidate.linkedin_url && (
              <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#0f2d1f] hover:underline">
                LinkedIn →
              </a>
            )}
            {candidate.github_url && (
              <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#0f2d1f] hover:underline">
                GitHub →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
