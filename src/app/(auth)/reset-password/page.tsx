import Link from 'next/link'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-1">
          <Link href="/" className="text-2xl font-bold text-blue-600">BetterJob</Link>
          <h1 className="text-lg font-semibold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  )
}
