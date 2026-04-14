import Link from 'next/link'
import CandidateMessageButton from '@/components/messages/CandidateMessageButton'

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
  location: string | null
  skills: string[]
  avatar_url: string | null
  open_to_work: boolean
  job_search_status: string
}

interface Props {
  candidate: Candidate
  matchedExperience: WorkExp | null
  employerId: string
}

export default function CandidateCard({ candidate, matchedExperience, employerId }: Props) {
  const initials = candidate.full_name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const visibleSkills = candidate.skills.slice(0, 5)
  const extraSkills = candidate.skills.length - visibleSkills.length

  return (
    <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-5
                    shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]
                    flex flex-col sm:flex-row sm:items-center justify-between gap-4
                    hover:shadow-[0_4px_8px_rgba(28,22,18,0.07),0_12px_32px_rgba(15,45,31,0.11)]
                    hover:border-[#c9b8a2] hover:-translate-y-0.5
                    transition-all duration-200">

      {/* Left: avatar + info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {candidate.avatar_url ? (
          <img
            src={candidate.avatar_url}
            alt={candidate.full_name}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-sm font-bold
                          flex items-center justify-center shrink-0">
            {initials}
          </div>
        )}

        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-semibold text-[#1c1612]">{candidate.full_name}</h2>
            {candidate.open_to_work && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-[#d1fae5] text-[#065f46] ring-1 ring-[#a7f3d0]">
                Open to work
              </span>
            )}
          </div>

          {candidate.headline && (
            <p className="text-sm text-[#78716c]">{candidate.headline}</p>
          )}

          {candidate.location && (
            <p className="text-xs text-[#a8a29e]">{candidate.location}</p>
          )}

          {matchedExperience && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#78716c]">
                {matchedExperience.title} · {matchedExperience.company}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                matchedExperience.is_current
                  ? 'bg-[#d1fae5] text-[#065f46]'
                  : 'bg-[#f2ebe0] text-[#78716c]'
              }`}>
                {matchedExperience.is_current ? 'Current role' : 'Previous role'}
              </span>
            </div>
          )}

          {candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {visibleSkills.map(skill => (
                <span
                  key={skill}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-[#f2ebe0] text-[#0f2d1f] border border-[#e5d8c8] font-medium"
                >
                  {skill}
                </span>
              ))}
              {extraSkills > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f2ebe0] text-[#a8a29e] border border-[#e5d8c8]">
                  +{extraSkills} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/candidates/${candidate.id}`}
          className="text-sm border border-[#e5d8c8] text-[#78716c] px-4 py-2 rounded-xl
                     hover:border-[#cfc0ad] hover:text-[#0f2d1f] transition-colors"
        >
          View Profile
        </Link>
        <CandidateMessageButton employerId={employerId} candidateId={candidate.id} />
      </div>
    </div>
  )
}
