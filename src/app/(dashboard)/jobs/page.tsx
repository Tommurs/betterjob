import { createClient } from '@/lib/supabase/server'

export default async function JobsPage() {
  const supabase = createClient()
  const { data: jobs } = await supabase
    .from('job_listings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Job Listings</h1>
      {/* JobCard components go here */}
      <pre className="text-sm">{JSON.stringify(jobs, null, 2)}</pre>
    </main>
  )
}
