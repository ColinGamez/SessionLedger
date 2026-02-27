'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Database } from '@/types/supabase'

type SessionRow = Database['public']['Tables']['sessions']['Row']

export interface SessionsFilter {
  page?: number
  limit?: number
  tag?: string
  from?: string
  to?: string
}

export interface SessionsMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UseSessionsReturn {
  sessions: SessionRow[]
  meta: SessionsMeta | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  setFilter: (filter: Partial<SessionsFilter>) => void
  filter: SessionsFilter
}

const DEFAULT_FILTER: SessionsFilter = { page: 1, limit: 20 }

export function useSessions(initial: SessionsFilter = DEFAULT_FILTER): UseSessionsReturn {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [meta, setMeta] = useState<SessionsMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilterState] = useState<SessionsFilter>(initial)

  // Abort previous request on filter change
  const abortRef = useRef<AbortController | null>(null)

  const fetch = useCallback(async (currentFilter: SessionsFilter) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (currentFilter.page) params.set('page', String(currentFilter.page))
    if (currentFilter.limit) params.set('limit', String(currentFilter.limit))
    if (currentFilter.tag) params.set('tag', currentFilter.tag)
    if (currentFilter.from) params.set('from', currentFilter.from)
    if (currentFilter.to) params.set('to', currentFilter.to)

    try {
      const res = await window.fetch(`/api/sessions?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('Failed to load sessions')
      const json = await res.json()
      setSessions(json.data ?? [])
      setMeta(json.meta ?? null)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch(filter)
  }, [fetch, filter])

  const setFilter = useCallback((partial: Partial<SessionsFilter>) => {
    setFilterState((prev) => ({ ...prev, ...partial }))
  }, [])

  return {
    sessions,
    meta,
    loading,
    error,
    refetch: () => fetch(filter),
    setFilter,
    filter,
  }
}
