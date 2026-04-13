import Link from 'next/link'
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm'

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 bg-[#faf6ef]">
      <div className="w-full max-w-md bg-[#fffefb] rounded-2xl border border-[#e5d8c8] shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_20px_rgba(28,22,18,0.08)] p-8 space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="heading-display text-2xl font-bold text-[#0f2d1f]">BetterJob</Link>
          <h1 className="heading-display text-lg font-semibold text-[#1c1612]">Choose a new password</h1>
          <p className="text-sm text-[#78716c]">Must be at least 8 characters</p>
        </div>
        <UpdatePasswordForm />
      </div>
    </main>
  )
}
