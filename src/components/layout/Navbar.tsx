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
    <nav className="sticky top-0 z-50 bg-[#fffefb] border-b border-[#e5d8c8] shadow-[0_1px_0_rgba(28,22,18,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-3 items-center h-16">

        {/* Logo — left */}
        <Link href="/" className="flex items-center gap-2.5 group justify-self-start">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0f2d1f] to-[#1a4a32]
                          flex items-center justify-center text-white text-xs font-bold
                          shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-150">
            B
          </div>
          <span className="heading-display font-bold text-[#0f2d1f] tracking-tight text-[15px]">
            BetterJob
          </span>
        </Link>

        {/* Nav links — center */}
        <div className="hidden sm:flex items-center justify-center gap-1 text-sm">
          <Link
            href="/jobs"
            className="text-[#78716c] hover:text-[#1c1612] hover:bg-[#e5d8c8]/40 font-medium
                       transition-colors px-3 py-1.5 rounded-lg"
          >
            {profile?.role === 'employer' ? 'Browse Candidates' : 'Browse Jobs'}
          </Link>
        </div>

        {/* Auth — right */}
        {user && profile ? (
          <div className="flex justify-end">
            <NavbarUserMenu
              fullName={profile.full_name}
              role={profile.role}
              avatarUrl={profile.avatar_url}
            />
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <Link
              href="/login"
              className="text-sm text-[#0f2d1f] hover:text-[#1c1612] font-semibold
                         transition-colors px-3 py-1.5 rounded-lg hover:bg-[#e5d8c8]/40"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm px-4 py-2 rounded-xl
                         shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
