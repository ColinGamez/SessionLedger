import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// ----------------------------------------------------------------
// Service role client — bypasses RLS
// ONLY use in:
//   - Stripe webhook handler
//   - Cron jobs / admin scripts
// NEVER expose to the client side
// ----------------------------------------------------------------
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
