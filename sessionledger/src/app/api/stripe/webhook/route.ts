import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe/client'
import {
  syncSubscriptionToDb,
  cancelSubscriptionInDb,
  getOrCreateStripeCustomer,
} from '@/lib/stripe/subscription'
import { createServiceClient } from '@/lib/supabase/service'

// Must disable body parsing — Stripe requires the raw body
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe:webhook] Signature verification failed', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    await handleStripeEvent(event)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe:webhook] Handler error', { type: event.type, message })
    // Return 500 so Stripe retries
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ----------------------------------------------------------------
async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscriptionToDb(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id
      await cancelSubscriptionInDb(customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // subscription.updated will also fire with past_due — handled there
      // Log for alerting / email campaigns
      console.warn('[stripe:webhook] Payment failed', {
        customer: invoice.customer,
        invoiceId: invoice.id,
      })
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        await syncSubscriptionToDb(subscription)
      }
      break
    }

    default:
      // Unhandled event types — silently ignore
      break
  }
}
