import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe/client'
import { getOrCreateStripeCustomer } from '@/lib/stripe/subscription'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const customerId = await getOrCreateStripeCustomer(user.id, user.email!)

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    if (profile?.subscription_status === 'active') {
      return NextResponse.json(
        { error: 'Already subscribed' },
        { status: 409 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICES.PRO_MONTHLY,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=canceled`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[stripe:checkout] Failed to create session', message)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
