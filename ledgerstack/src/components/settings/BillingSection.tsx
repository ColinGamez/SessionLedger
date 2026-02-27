'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { useUpgrade } from '@/hooks/useUpgrade'
import { formatDate } from '@/lib/utils/format'
import type { Database } from '@/types/supabase'

type SubscriptionStatus = Database['public']['Tables']['profiles']['Row']['subscription_status']

interface BillingSectionProps {
  isPro: boolean
  subscriptionStatus: SubscriptionStatus
  periodEnd: string | null
  hasCustomer: boolean
}

const statusBadgeVariant: Record<SubscriptionStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  trialing: 'info' as 'default', // map to default since Badge only has those variants
  past_due: 'warning',
  canceled: 'danger',
  free: 'default',
}

export function BillingSection({
  isPro,
  subscriptionStatus,
  periodEnd,
  hasCustomer,
}: BillingSectionProps) {
  const { startCheckout, openPortal, loading, error } = useUpgrade()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Plan</CardTitle>
        <Badge variant={statusBadgeVariant[subscriptionStatus] ?? 'default'}>
          {subscriptionStatus === 'active'
            ? 'Pro'
            : subscriptionStatus === 'trialing'
            ? 'Trial'
            : subscriptionStatus === 'past_due'
            ? 'Past Due'
            : subscriptionStatus === 'canceled'
            ? 'Canceled'
            : 'Free'}
        </Badge>
      </CardHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      <div className="space-y-4">
        {isPro ? (
          <>
            <div className="space-y-1">
              <p className="text-sm text-zinc-300">
                You are on the <strong className="text-emerald-400">Pro plan</strong> with unlimited
                sessions and CSV export.
              </p>
              {periodEnd && (
                <p className="text-xs text-zinc-500">
                  Renews {formatDate(periodEnd)}
                </p>
              )}
            </div>
            {hasCustomer && (
              <Button variant="secondary" size="md" onClick={openPortal} loading={loading}>
                Manage Billing
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="rounded-lg border border-zinc-800 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Free Plan</p>
                  <p className="text-xs text-zinc-500 mt-0.5">10 sessions max</p>
                </div>
                <Badge variant="default">Current</Badge>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Pro Plan</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Unlimited sessions · CSV export · Priority support</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400 shrink-0">$9 / mo</span>
              </div>
              <Button variant="primary" size="md" onClick={startCheckout} loading={loading}>
                Upgrade to Pro
              </Button>
            </div>

            {subscriptionStatus === 'canceled' && hasCustomer && (
              <p className="text-xs text-zinc-500">
                Previously subscribed?{' '}
                <button onClick={openPortal} className="text-emerald-400 hover:text-emerald-300 underline">
                  Reactivate via billing portal
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
