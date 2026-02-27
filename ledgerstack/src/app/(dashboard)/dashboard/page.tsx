import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan, FREE_TIER_SESSION_LIMIT } from '@/lib/utils/plan'
import { formatCurrency, formatPercent } from '@/lib/utils/format'
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

  // All three queries run in parallel — single round-trip
  const [profileRes, statsRes, recentRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('subscription_status, subscription_period_end')
      .eq('id', user.id)
      .single(),
    supabase
      .from('sessions')
      .select('in_amount, out_amount')
      .eq('user_id', user.id),
    supabase
      .from('sessions')
      .select('id, title, started_at, in_amount, out_amount, tags')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5),
  ])

  const profile = profileRes.data
  const allRows = statsRes.data ?? []
  const recentSessions = recentRes.data ?? []

  // Aggregate server-side — no extra query
  const totalIn = allRows.reduce((s, r) => s + (r.in_amount ?? 0), 0)
  const totalOut = allRows.reduce((s, r) => s + (r.out_amount ?? 0), 0)
  const netProfit = totalOut - totalIn
  const roi = totalIn > 0 ? (netProfit / totalIn) * 100 : null
  const sessionCount = allRows.length

  const plan = profile ? getUserPlan(profile) : null
  const nearLimit = plan?.isFree && sessionCount >= FREE_TIER_SESSION_LIMIT - 2

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
          subtext={`${sessionCount} session${sessionCount !== 1 ? 's' : ''}`}
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
          variant={netProfit > 0 ? 'positive' : netProfit < 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          label="ROI"
          value={roi !== null ? formatPercent(roi) : '—'}
          subtext={sessionCount === 0 ? 'No sessions yet' : undefined}
          variant={roi !== null && roi > 0 ? 'positive' : roi !== null && roi < 0 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Recent sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Sessions</h2>
          <a
            href="/sessions"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all →
          </a>
        </div>
        <RecentSessions sessions={recentSessions} />
      </div>
    </div>
  )
}
