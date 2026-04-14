'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  fullName: string
  role: string
  avatarUrl?: string | null
}

const MENU_ITEMS: { label: string; href: string; badge?: string }[] = [
  { label: 'Dashboard',  href: '/dashboard' },
  { label: 'Profile',    href: '/profile' },
  { label: 'Messages',   href: '/messages' },
  { label: 'Settings',   href: '/settings' },
]

export default function NavbarUserMenu({ fullName, role, avatarUrl }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = fullName
    .split(' ')
    .map(n => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5
                   hover:bg-[#e5d8c8]/40 transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#0f2d1f] text-white text-xs font-bold
                          flex items-center justify-center">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-[#1c1612] leading-tight">{fullName}</p>
          <p className="text-xs text-[#a8a29e] capitalize leading-tight">{role?.replace('_', ' ')}</p>
        </div>
        <svg
          className={`w-4 h-4 text-[#a8a29e] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-[#fffefb] border border-[#e5d8c8] rounded-2xl
                        shadow-[0_8px_32px_rgba(28,22,18,0.10)] py-1.5 z-50">
          <div className="px-4 py-3 border-b border-[#e5d8c8]">
            <p className="text-sm font-semibold text-[#1c1612] truncate">{fullName}</p>
            <p className="text-xs text-[#a8a29e] capitalize mt-0.5">{role?.replace('_', ' ')}</p>
          </div>

          <div className="py-1">
            {MENU_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-4 py-2 text-sm text-[#78716c]
                           hover:text-[#1c1612] hover:bg-[#e5d8c8]/30 transition-colors"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-[#e5d8c8] text-[#a8a29e] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="border-t border-[#e5d8c8] py-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#a8a29e]
                         hover:bg-[#e5d8c8]/30 hover:text-[#1c1612] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
