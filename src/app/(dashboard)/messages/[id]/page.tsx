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
    // Account for navbar (64px) + layout padding (p-6 = 24px top+bottom = 48px → 112px total)
    // At lg, p-8 = 32px top+bottom = 64px → 128px total
    <div className="flex flex-col h-[calc(100vh-112px)] lg:h-[calc(100vh-128px)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-[#a8a29e] hover:text-[#78716c] transition-colors font-medium shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#0f2d1f] text-[#faf6ef] text-sm font-bold flex items-center justify-center shrink-0">
            {otherPerson?.full_name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1c1612] truncate">{otherPerson?.full_name}</p>
            <Link
              href={`/jobs/${(conv.job_listings as any)?.id}`}
              className="text-xs text-[#78716c] hover:text-[#0f2d1f] transition-colors truncate block"
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
    </div>
  )
}
