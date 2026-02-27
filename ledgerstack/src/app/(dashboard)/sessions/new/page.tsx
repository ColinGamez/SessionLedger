import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan, FREE_TIER_SESSION_LIMIT } from '@/lib/utils/plan'
import { SessionForm } from '@/components/sessions/SessionForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Session' }

export default async function NewSessionPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, countRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('subscription_status, subscription_period_end')
      .eq('id', user.id)
      .single(),
    supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const count = countRes.count ?? 0
  const plan = profile ? getUserPlan(profile) : null

  if (plan?.isFree && count >= FREE_TIER_SESSION_LIMIT) {
    redirect('/dashboard?upgrade=limit')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Session</h1>
        <p className="text-zinc-400 text-sm mt-1">Record a new trading or gaming session.</p>
      </div>
      <SessionForm mode="create" />
    </div>
  )
}
