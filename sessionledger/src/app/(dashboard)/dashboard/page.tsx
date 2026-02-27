import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan, FREE_TIER_SESSION_LIMIT } from '@/lib/utils/plan'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentSessions } from '@/components/dashboard/RecentSessions'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile + sessions in parallel
  const [profileRes, sessionsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('subscription_status, subscription_period_end')
      .eq('id', user.id)
      .single(),
    supabase
      .from('sessions')
      .select('id, title, started_at, in_amount, out_amount, tags')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const recentSessions = sessionsRes.data ?? []

  // Aggregate stats — computed server-side
  const statsRes = await supabase
    .from('sessions')
    .select('in_amount, out_amount')
    .eq('user_id', user.id)

  const allSessions = statsRes.data ?? []
  const totalIn = allSessions.reduce((s, r) => s + (r.in_amount ?? 0), 0)
  const totalOut = allSessions.reduce((s, r) => s + (r.out_amount ?? 0), 0)
  const netProfit = totalOut - totalIn
  const roi = totalIn > 0 ? ((netProfit / totalIn) * 100) : null

  const plan = profile ? getUserPlan(profile) : null
  const sessionCount = allSessions.length
  const nearLimit = !plan?.isPro && sessionCount >= FREE_TIER_SESSION_LIMIT - 2

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Your session performance at a glance.</p>
      </div>

      {nearLimit && (
        <UpgradeBanner used={sessionCount} limit={FREE_TIER_SESSION_LIMIT} />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total In"
          value={formatCurrency(totalIn)}
          subtext={`${sessionCount} sessions`}
          variant="neutral"
        />
        <StatCard
          label="Total Out"
          value={formatCurrency(totalOut)}
          variant="neutral"
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(netProfit)}
          variant={netProfit >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="ROI"
          value={roi !== null ? `${roi.toFixed(1)}%` : '—'}
          variant={roi !== null && roi >= 0 ? 'positive' : 'negative'}
        />
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Recent Sessions</h2>
          <a href="/sessions" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            View all
          </a>
        </div>
        <RecentSessions sessions={recentSessions} />
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}
