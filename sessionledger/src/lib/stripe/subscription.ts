import Stripe from 'stripe'
import { stripe } from './client'
import { createServiceClient } from '@/lib/supabase/service'

// ----------------------------------------------------------------
// Sync a Stripe subscription to our profiles table
// Called from webhook handler — uses service role (bypasses RLS)
// ----------------------------------------------------------------
export async function syncSubscriptionToDb(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = createServiceClient()

  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id

  const priceId = subscription.items.data[0]?.price?.id ?? null
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  const status = mapStripeStatus(subscription.status)

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      subscription_status: status,
      subscription_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[stripe:sync] Failed to sync subscription', {
      subscriptionId: subscription.id,
      customerId,
      error,
    })
    throw new Error(`Subscription sync failed: ${error.message}`)
  }
}

// ----------------------------------------------------------------
// Delete / cancel — set status to canceled
// ----------------------------------------------------------------
export async function cancelSubscriptionInDb(
  customerId: string
): Promise<void> {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      subscription_period_end: null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('[stripe:cancel] Failed to cancel subscription', { customerId, error })
    throw new Error(`Subscription cancel failed: ${error.message}`)
  }
}

// ----------------------------------------------------------------
// Ensure a Stripe customer exists for a user
// ----------------------------------------------------------------
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  const supabase = createServiceClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error) throw new Error(`Failed to fetch profile: ${error.message}`)

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`Failed to persist customer id: ${updateError.message}`)
  }

  return customer.id
}

// ----------------------------------------------------------------
// Map Stripe subscription status → our status enum
// ----------------------------------------------------------------
function mapStripeStatus(
  status: Stripe.Subscription.Status
): 'free' | 'active' | 'past_due' | 'canceled' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'free'
  }
}
