'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Database } from '@/types/supabase'
import { getUserPlan, FREE_TIER_SESSION_LIMIT } from '@/lib/utils/plan'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

export interface ProfileData extends ProfileRow {
  session_count: number
}

interface UseProfileReturn {
  profile: ProfileData | null
  loading: boolean
  error: string | null
  isPro: boolean
  sessionLimit: number
  refetch: () => Promise<void>
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await window.fetch('/api/user/profile')
      if (!res.ok) throw new Error('Failed to load profile')
      const json = await res.json()
      setProfile(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
  }, [fetch])

  const plan = profile
    ? getUserPlan({
        subscription_status: profile.subscription_status,
        subscription_period_end: profile.subscription_period_end,
      })
    : null

  return {
    profile,
    loading,
    error,
    isPro: plan?.isPro ?? false,
    sessionLimit: plan?.sessionLimit ?? FREE_TIER_SESSION_LIMIT,
    refetch: fetch,
  }
}
