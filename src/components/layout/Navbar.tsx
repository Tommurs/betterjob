import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NavbarUserMenu from './NavbarUserMenu'

export default async function Navbar() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">
          BetterJob
        </Link>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/jobs" className="hover:text-blue-600 transition-colors">
            Browse Jobs
          </Link>
        </div>

        {/* Auth area */}
        {user && profile ? (
          <NavbarUserMenu
            fullName={profile.full_name}
            role={profile.role}
            avatarUrl={profile.avatar_url}
          />
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
