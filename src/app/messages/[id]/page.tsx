import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import MessageThread from '@/components/messages/MessageThread'

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: conv } = await supabase
    .from('conversations')
    .select(`
      id,
      job_listings ( id, title, company ),
      employer:profiles!conversations_employer_id_fkey ( id, full_name ),
      applicant:profiles!conversations_applicant_id_fkey ( id, full_name ),
      messages ( id, content, is_read, sender_id, created_at )
    `)
    .eq('id', params.id)
    .single()

  if (!conv) notFound()

  // Mark unread messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', params.id)
    .neq('sender_id', user.id)

  const otherPerson = (conv.employer as any)?.id === user.id
    ? conv.applicant as any
    : conv.employer as any

  const messages = ((conv.messages as any[]) ?? []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/messages" className="text-sm text-blue-600 hover:underline shrink-0">
          ← Back
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
            {otherPerson?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{otherPerson?.full_name}</p>
            <Link
              href={`/jobs/${(conv.job_listings as any)?.id}`}
              className="text-xs text-blue-600 hover:underline truncate block"
            >
              Re: {(conv.job_listings as any)?.title} · {(conv.job_listings as any)?.company}
            </Link>
          </div>
        </div>
      </div>

      {/* Thread */}
      <MessageThread
        conversationId={conv.id}
        messages={messages}
        currentUserId={user.id}
      />
    </main>
  )
}
