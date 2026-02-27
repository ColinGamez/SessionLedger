'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getUserPlan, FREE_TIER_SESSION_LIMIT } from '@/lib/utils/plan'
import type { Database } from '@/types/supabase'

type Profile = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'email' | 'full_name' | 'subscription_status' | 'subscription_period_end'
> | null

interface AppShellProps {
  children: React.ReactNode
  profile: Profile
}

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/sessions/new', label: 'New Session' },
]

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname()
  const plan = profile ? getUserPlan(profile) : null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 border-r border-zinc-800 bg-zinc-900">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <span className="text-lg font-semibold tracking-tight">
            Ledger<span className="text-emerald-400">Stack</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Plan badge */}
        {plan && (
          <div className="p-4 border-t border-zinc-800">
            {plan.isPro ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Pro Plan
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-zinc-500 px-1">
                  Free tier
                </div>
                <Link
                  href="/dashboard?upgrade=true"
                  className="block w-full text-center px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:pl-60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
