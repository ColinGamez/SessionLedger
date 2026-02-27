import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// ----------------------------------------------------------------
// Browser (client component) Supabase client
// Singleton pattern — safe to call multiple times
// ----------------------------------------------------------------
let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}
