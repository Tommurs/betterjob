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
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-1">
          {conversations?.length ?? 0} conversation{conversations?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-4xl">✉️</p>
          <p className="text-gray-500 text-sm">No messages yet.</p>
          <p className="text-xs text-gray-400">
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
                className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {otherPerson?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900 truncate">
                      {otherPerson?.full_name ?? 'Unknown'}
                    </p>
                    {lastMessage && (
                      <p className="text-xs text-gray-400 shrink-0">
                        {formatDate(lastMessage.created_at)}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-blue-600 truncate mt-0.5">
                    Re: {conv.job_listings?.title} · {conv.job_listings?.company}
                  </p>
                  {lastMessage && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {lastMessage.sender_id === user.id ? 'You: ' : ''}
                      {lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread badge */}
                {unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1">
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
