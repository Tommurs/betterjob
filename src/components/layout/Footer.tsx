import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
        <p>© {new Date().getFullYear()} BetterJob. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/jobs" className="hover:text-blue-600 transition-colors">Browse Jobs</Link>
          <Link href="/signup" className="hover:text-blue-600 transition-colors">Post a Job</Link>
          <Link href="/login" className="hover:text-blue-600 transition-colors">Sign in</Link>
        </div>
      </div>
    </footer>
  )
}
