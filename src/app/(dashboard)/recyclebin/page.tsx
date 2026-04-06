import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecycleBin from '@/components/dashboard/RecycleBin'

export default async function RecycleBinPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'employer') redirect('/dashboard')

  const { data: jobs } = await supabase
    .from('job_listings')
    .select('id, title, location, type, created_at, deleted_at')
    .eq('employer_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <RecycleBin jobs={jobs ?? []} />
    </main>
  )
}
