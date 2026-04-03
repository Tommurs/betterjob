import Link from "next/link";

export default function Navbar() {
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
          <Link href="/companies" className="hover:text-blue-600 transition-colors">
            Companies
          </Link>
        </div>

        {/* Auth buttons */}
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
      </div>
    </nav>
  );
}
