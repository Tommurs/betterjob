import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobSeekerDashboard from '@/components/dashboard/JobSeekerDashboard'
import EmployerDashboard from '@/components/dashboard/EmployerDashboard'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'jobseeker'

  // --- Job seeker: fetch newest active listings ---
  if (role === 'jobseeker') {
    const { data: jobs } = await supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    return <JobSeekerDashboard jobs={jobs ?? []} />
  }

  // --- Employer: fetch their jobs with application counts ---
  const { data: jobs } = await supabase
    .from('job_listings')
    .select(`
      id, title, location, type, is_active, created_at,
      applications(count)
    `)
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })

  const jobsWithCounts = (jobs ?? []).map((job: any) => ({
    ...job,
    application_count: job.applications?.[0]?.count ?? 0,
  })).sort((a: any, b: any) => b.application_count - a.application_count)

  return <EmployerDashboard jobs={jobsWithCounts} />
}
