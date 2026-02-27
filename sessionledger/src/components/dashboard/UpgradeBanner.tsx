'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UpgradeBannerProps {
  used: number
  limit: number
}

export function UpgradeBanner({ used, limit }: UpgradeBannerProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      setLoading(false)
    }
  }

  const pct = Math.round((used / limit) * 100)
  const atLimit = used >= limit

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-300">
            {atLimit ? 'Session limit reached' : `${limit - used} session${limit - used !== 1 ? 's' : ''} remaining`}
          </p>
          <p className="text-xs text-zinc-400">
            You've used {used} of {limit} free sessions. Upgrade to Pro for unlimited sessions and CSV export.
          </p>
          {/* Progress bar */}
          <div className="w-48 h-1.5 rounded-full bg-zinc-800 mt-2">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="shrink-0 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Redirecting...' : 'Upgrade to Pro'}
        </button>
      </div>
    </div>
  )
}
