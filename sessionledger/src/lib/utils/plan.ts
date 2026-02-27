import type { Database } from '@/types/supabase'

type Profile = Database['public']['Tables']['profiles']['Row']

export const FREE_TIER_SESSION_LIMIT = 10

// ----------------------------------------------------------------
// Derive the effective plan from a profile row
// ----------------------------------------------------------------
export function getUserPlan(profile: Pick<Profile, 'subscription_status' | 'subscription_period_end'>) {
  const { subscription_status, subscription_period_end } = profile

  const isPro =
    (subscription_status === 'active' || subscription_status === 'trialing') &&
    (subscription_period_end === null ||
      new Date(subscription_period_end) > new Date())

  return {
    isPro,
    isFree: !isPro,
    canExport: isPro,
    sessionLimit: isPro ? Infinity : FREE_TIER_SESSION_LIMIT,
  }
}

// ----------------------------------------------------------------
// Server-side gate: throws an AppError if the user is over limit
// Used in API routes before inserting a new session
// ----------------------------------------------------------------
export class PlanLimitError extends Error {
  readonly code = 'PLAN_LIMIT_EXCEEDED'
  readonly statusCode = 403

  constructor(message = 'Session limit reached. Upgrade to Pro for unlimited sessions.') {
    super(message)
    this.name = 'PlanLimitError'
  }
}

export async function assertSessionLimitNotReached(
  supabase: ReturnType<typeof import('@/lib/supabase/server').createServerClient>,
  userId: string
): Promise<void> {
  // Fetch plan inline — no trust from client
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_period_end')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error('Could not verify plan status')
  }

  const { isPro, sessionLimit } = getUserPlan(profile)
  if (isPro) return // unlimited

  // Count sessions server-side — RLS guarantees user_id scope
  const { count, error: countError } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) throw new Error('Could not count sessions')

  if ((count ?? 0) >= sessionLimit) {
    throw new PlanLimitError()
  }
}
