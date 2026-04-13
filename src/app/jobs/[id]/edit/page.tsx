import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditJobForm from '@/components/jobs/EditJobForm'

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('job_listings')
    .select('*')
    .eq('id', params.id)
    .eq('employer_id', user.id)
    .single()

  // 404 if job doesn't exist or doesn't belong to this employer
  if (!job) notFound()

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#1c1612]">Edit listing</h1>
        <p className="text-sm text-[#78716c] mt-1">{job.title} · {job.company}</p>
      </div>
      <EditJobForm job={job} />
    </main>
  )
}
