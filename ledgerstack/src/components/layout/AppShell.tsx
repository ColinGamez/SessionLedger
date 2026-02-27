'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getUserPlan } from '@/lib/utils/plan'
import { useUpgrade } from '@/hooks/useUpgrade'
import { MobileNav } from './MobileNav'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
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
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: '/sessions',
    label: 'Sessions',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    ),
  },
  {
    href: '/sessions/new',
    label: 'New Session',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 4v16m8-8H4"
        />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { startCheckout, loading: upgradeLoading } = useUpgrade()
  const plan = profile ? getUserPlan(profile) : null

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 border-r border-zinc-800 bg-zinc-900 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Ledger<span className="text-emerald-400">Stack</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/sessions/new')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Plan + User */}
        <div className="border-t border-zinc-800 p-3 space-y-3 shrink-0">
          {plan && (
            plan.isPro ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-xs font-medium text-emerald-400">Pro Plan</span>
              </div>
            ) : (
              <button
                onClick={startCheckout}
                disabled={upgradeLoading}
                className="w-full px-3 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {upgradeLoading ? 'Redirecting...' : 'Upgrade to Pro'}
              </button>
            )
          )}

          <div className="flex items-center justify-between px-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">
                {profile?.full_name ?? profile?.email ?? 'Account'}
              </p>
              {profile?.full_name && (
                <p className="text-xs text-zinc-500 truncate">{profile.email}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="shrink-0 ml-2 p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <MobileNav />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-60">
        <main className="flex-1 px-4 sm:px-6 py-6 lg:py-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
