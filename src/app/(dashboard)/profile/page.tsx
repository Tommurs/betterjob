import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Your Profile</h1>
        <p className="text-sm text-[#78716c] mt-1">
          {profile?.role === 'employer'
            ? 'This information appears on your job listings'
            : 'This information is shown to employers when you apply'}
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
