import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function MessagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id,
      created_at,
      job_listings ( id, title, company ),
      employer:profiles!conversations_employer_id_fkey ( id, full_name ),
      applicant:profiles!conversations_applicant_id_fkey ( id, full_name ),
      messages ( id, content, is_read, sender_id, created_at )
    `)
    .or(`employer_id.eq.${user.id},applicant_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Messages</h1>
        <p className="text-sm text-[#78716c] mt-1">
          {conversations?.length ?? 0} conversation{conversations?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 bg-[#f2ebe0] rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-[#a8a29e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-[#78716c] text-sm">No messages yet.</p>
          <p className="text-xs text-[#a8a29e]">
            Employers can message applicants from the applications view.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv: any) => {
            const messages = conv.messages ?? []
            const lastMessage = messages.sort((a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            const unreadCount = messages.filter(
              (m: any) => !m.is_read && m.sender_id !== user.id
            ).length
            const otherPerson = conv.employer?.id === user.id
              ? conv.applicant
              : conv.employer

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-start gap-4 p-4 bg-[#fffefb] border border-[#e5d8c8] rounded-2xl
                           hover:border-[#c9b8a2] hover:shadow-[0_4px_8px_rgba(28,22,18,0.07)] hover:-translate-y-0.5
                           transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-sm font-bold flex items-center justify-center shrink-0">
                  {otherPerson?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#1c1612] truncate">
                      {otherPerson?.full_name ?? 'Unknown'}
                    </p>
                    {lastMessage && (
                      <p className="text-xs text-[#a8a29e] shrink-0">
                        {formatDate(lastMessage.created_at)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-[#78716c] truncate mt-0.5">
                    Re: {conv.job_listings?.title} · {conv.job_listings?.company}
                  </p>
                  {lastMessage && (
                    <p className="text-sm text-[#78716c] truncate mt-1">
                      {lastMessage.sender_id === user.id ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-xs font-bold flex items-center justify-center shrink-0 mt-1">
                    {unreadCount}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
