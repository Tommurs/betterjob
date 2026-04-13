import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#081a10]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center
                              text-white text-xs font-bold">
                B
              </div>
              <span className="heading-display text-white font-bold tracking-tight">BetterJob</span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-[200px]">
              Connecting great people with companies worth working for.
            </p>
          </div>

          {/* For Job Seekers */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">
              For Job Seekers
            </p>
            <div className="space-y-2.5">
              <Link href="/jobs" className="block text-sm text-white/50 hover:text-white transition-colors">
                Browse Jobs
              </Link>
              <Link href="/signup" className="block text-sm text-white/50 hover:text-white transition-colors">
                Create account
              </Link>
              <Link href="/login" className="block text-sm text-white/50 hover:text-white transition-colors">
                Sign in
              </Link>
            </div>
          </div>

          {/* For Employers */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-white/25 uppercase tracking-widest">
              For Employers
            </p>
            <div className="space-y-2.5">
              <Link href="/signup" className="block text-sm text-white/50 hover:text-white transition-colors">
                Post a Job
              </Link>
              <Link href="/login" className="block text-sm text-white/50 hover:text-white transition-colors">
                Employer login
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-white/8">
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} BetterJob. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
