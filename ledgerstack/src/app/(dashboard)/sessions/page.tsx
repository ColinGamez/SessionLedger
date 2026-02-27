import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan } from '@/lib/utils/plan'
import { SessionsTable } from '@/components/sessions/SessionsTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Sessions' }
export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_period_end')
    .eq('id', user.id)
    .single()

  const plan = profile ? getUserPlan(profile) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
        <p className="text-zinc-400 text-sm mt-1">
          {plan?.isPro
            ? 'All your sessions. Export to CSV anytime.'
            : 'Your session history. Upgrade to Pro for unlimited sessions and CSV export.'}
        </p>
      </div>
      <SessionsTable isPro={plan?.isPro ?? false} />
    </div>
  )
}
