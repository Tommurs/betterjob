import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PasswordForm from '@/components/settings/PasswordForm'
import NotificationsForm from '@/components/settings/NotificationsForm'
import PrivacyForm from '@/components/settings/PrivacyForm'
import JobPreferencesForm from '@/components/settings/JobPreferencesForm'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, notification_preferences, profile_visibility, open_to_work, invite_to_apply, job_search_status, job_preferences')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'jobseeker'
  const isJobseeker = role !== 'employer'

  return (
    <div className="max-w-2xl space-y-10">

      <div>
        <h1 className="heading-display text-xl font-bold text-[#1c1612]">Settings</h1>
        <p className="text-sm text-[#78716c] mt-1">Manage your account and security preferences</p>
      </div>

      {/* Account */}
      <section className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl overflow-hidden
                           shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="px-6 py-4 border-b border-[#e5d8c8]">
          <h2 className="text-sm font-semibold text-[#1c1612]">Account</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-1">
              Email address
            </p>
            <p className="text-sm text-[#1c1612] font-medium">{user.email}</p>
            <p className="text-xs text-[#a8a29e] mt-0.5">
              Contact support to change your email address.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#a8a29e] uppercase tracking-widest mb-1">
              Account type
            </p>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full
                             bg-[#f2ebe0] text-[#0f2d1f] capitalize">
              {role === 'employer' ? 'Employer' : 'Job Seeker'}
            </span>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl overflow-hidden
                           shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="px-6 py-4 border-b border-[#e5d8c8]">
          <h2 className="text-sm font-semibold text-[#1c1612]">Notifications</h2>
          <p className="text-xs text-[#a8a29e] mt-0.5">Choose which email notifications you receive</p>
        </div>
        <div className="px-6 py-5">
          <NotificationsForm
            userId={user.id}
            role={role}
            initial={profile?.notification_preferences ?? null}
          />
        </div>
      </section>

      {/* Privacy & Visibility */}
      <section className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl overflow-hidden
                           shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="px-6 py-4 border-b border-[#e5d8c8]">
          <h2 className="text-sm font-semibold text-[#1c1612]">Privacy &amp; Visibility</h2>
          <p className="text-xs text-[#a8a29e] mt-0.5">Control who can find and view your profile</p>
        </div>
        <div className="px-6 py-5">
          <PrivacyForm
            userId={user.id}
            role={role}
            profileVisibility={profile?.profile_visibility ?? 'public'}
            openToWork={profile?.open_to_work ?? false}
            inviteToApply={profile?.invite_to_apply ?? true}
            jobSearchStatus={profile?.job_search_status ?? 'open'}
          />
        </div>
      </section>

      {/* Job Preferences — jobseekers only */}
      {isJobseeker && (
        <section className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl overflow-hidden
                             shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
          <div className="px-6 py-4 border-b border-[#e5d8c8]">
            <h2 className="text-sm font-semibold text-[#1c1612]">Job Preferences</h2>
            <p className="text-xs text-[#a8a29e] mt-0.5">Tell us what you are looking for</p>
          </div>
          <div className="px-6 py-5">
            <JobPreferencesForm
              userId={user.id}
              initial={profile?.job_preferences ?? null}
            />
          </div>
        </section>
      )}

      {/* Security */}
      <section className="bg-[#fffefb] border border-[#e5d8c8] rounded-2xl overflow-hidden
                           shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="px-6 py-4 border-b border-[#e5d8c8]">
          <h2 className="text-sm font-semibold text-[#1c1612]">Security</h2>
          <p className="text-xs text-[#a8a29e] mt-0.5">Change your password at any time</p>
        </div>
        <div className="px-6 py-5">
          <PasswordForm />
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-[#fffefb] border border-red-100 rounded-2xl overflow-hidden
                           shadow-[0_1px_3px_rgba(28,22,18,0.05),0_4px_16px_rgba(28,22,18,0.06)]">
        <div className="px-6 py-4 border-b border-red-100">
          <h2 className="text-sm font-semibold text-red-600">Danger zone</h2>
        </div>
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#1c1612]">Delete account</p>
            <p className="text-xs text-[#a8a29e] mt-0.5">
              Permanently remove your account and all associated data. This cannot be undone.
            </p>
          </div>
          <a
            href={`mailto:support@betterjob.com?subject=Account deletion request&body=Please delete my account associated with ${user.email}`}
            className="shrink-0 text-sm font-semibold text-red-500 border border-red-200
                       px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
          >
            Request deletion
          </a>
        </div>
      </section>

    </div>
  )
}
