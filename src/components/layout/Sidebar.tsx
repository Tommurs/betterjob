'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const JOBSEEKER_NAV = [
  { label: 'Browse Jobs',      href: '/jobs',                 icon: '🔍' },
  { label: 'My Applications',  href: '/applications',         icon: '📋' },
  { label: 'Saved Jobs',       href: '/saved',                icon: '🔖' },
  { label: 'Profile',          href: '/profile',              icon: '👤' },
]

const EMPLOYER_NAV = [
  { label: 'Posted Jobs',      href: '/dashboard',            icon: '📌' },
  { label: 'Post a Job',       href: '/jobs/post',            icon: '➕' },
  { label: 'Profile',          href: '/profile',              icon: '🏢' },
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

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* User info */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center mb-3">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
        <p className="text-xs text-gray-400 capitalize mt-0.5">{role}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <span className="text-base">🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
