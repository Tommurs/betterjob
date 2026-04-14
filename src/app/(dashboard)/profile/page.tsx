import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import WorkExperienceForm from '@/components/profile/WorkExperienceForm'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: experience }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('work_experience')
      .select('*')
      .eq('profile_id', user.id)
      .order('start_date', { ascending: false }),
  ])

  const isJobseeker = profile?.role !== 'employer'

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

      {isJobseeker && (
        <div className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl p-6
                        shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <WorkExperienceForm profileId={user.id} initialExperience={experience ?? []} />
        </div>
      )}
    </div>
  )
}
