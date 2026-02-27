import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/utils/plan'
import { BillingSection } from '@/components/settings/BillingSection'
import { ProfileSection } from '@/components/settings/ProfileSection'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const plan = getUserPlan(profile)

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your account and billing.</p>
      </div>

      <ProfileSection
        email={profile.email}
        fullName={profile.full_name ?? ''}
      />

      <BillingSection
        isPro={plan.isPro}
        subscriptionStatus={profile.subscription_status}
        periodEnd={profile.subscription_period_end}
        hasCustomer={!!profile.stripe_customer_id}
      />
    </div>
  )
}
