'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'

interface Message {
  id: string
  content: string
  sender_id: string
  is_read: boolean
  created_at: string
}

interface Props {
  conversationId: string
  messages: Message[]
  currentUserId: string
}

export default function MessageThread({ conversationId, messages: initial, currentUserId }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initial)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, supabase])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content) return

    setSending(true)
    setNewMessage('')

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    })

    setSending(false)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-[#a8a29e] py-10">
            No messages yet — say hello!
          </p>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%] space-y-1">
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMe
                    ? 'bg-[#0f2d1f] text-[#faf6ef] rounded-br-sm'
                    : 'bg-[#f2ebe0] text-[#1c1612] rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <p className={`text-xs text-[#a8a29e] ${isMe ? 'text-right' : 'text-left'}`}>
                  {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-[#e5d8c8]">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Write a message..."
          disabled={sending}
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="btn-primary px-5 py-2.5"
        >
          Send
        </button>
      </form>
    </div>
  )
}
