import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PostJobForm from '@/components/jobs/PostJobForm'

export default async function PostJobPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Only employers can post jobs
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Post a job</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details below to publish your listing</p>
      </div>
      <PostJobForm companyName="" />
    </main>
  )
}
