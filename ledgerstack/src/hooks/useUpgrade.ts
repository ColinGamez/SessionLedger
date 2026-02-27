'use client'

import { useState } from 'react'

interface UseUpgradeReturn {
  startCheckout: () => Promise<void>
  openPortal: () => Promise<void>
  loading: boolean
  error: string | null
}

export function useUpgrade(): UseUpgradeReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to start checkout')
      if (json.url) window.location.href = json.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function openPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to open billing portal')
      if (json.url) window.location.href = json.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { startCheckout, openPortal, loading, error }
}
