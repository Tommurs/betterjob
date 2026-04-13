import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch the user's role from their profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'jobseeker'
  const fullName = profile?.full_name ?? user.email ?? 'User'

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar role={role} fullName={fullName} />
      <main className="flex-1 bg-[#faf6ef] p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
