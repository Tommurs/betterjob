'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const JOBSEEKER_NAV = [
  { label: 'Browse Jobs',     href: '/jobs' },
  { label: 'My Applications', href: '/applications' },
  { label: 'Messages',        href: '/messages' },
  { label: 'Saved Jobs',      href: '/saved' },
  { label: 'Profile',         href: '/profile' },
  { label: 'Settings',        href: '/settings' },
]

const EMPLOYER_NAV = [
  { label: 'Posted Jobs',  href: '/dashboard' },
  { label: 'Post a Job',   href: '/jobs/post' },
  { label: 'Messages',     href: '/messages' },
  { label: 'Profile',      href: '/profile' },
  { label: 'Recycle Bin',  href: '/recyclebin' },
  { label: 'Settings',     href: '/settings' },
]

interface SidebarProps {
  role: string
  fullName: string
}

export default function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navItems = role === 'employer' ? EMPLOYER_NAV : JOBSEEKER_NAV

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="w-60 shrink-0 bg-[#0f2d1f] border-r border-[#fffefb]/10 flex flex-col">
      {/* User info */}
      <div className="px-5 py-5 border-b border-[#fffefb]/10">
        <div className="w-9 h-9 rounded-full bg-[#fffefb]/15 text-[#faf6ef] text-sm font-bold
                        flex items-center justify-center mb-3">
          {initials}
        </div>
        <p className="text-sm font-semibold text-[#faf6ef] truncate">{fullName}</p>
        <p className="text-xs text-[#a8a29e] capitalize mt-0.5">{role?.replace('_', ' ')}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#fffefb]/10 text-white'
                  : 'text-[#d4c5b2] hover:bg-white/8 hover:text-[#faf6ef]'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#fffefb]/10">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-3 py-2.5 rounded-xl text-sm font-medium
                     text-[#a8a29e] hover:bg-white/8 hover:text-[#faf6ef] transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
