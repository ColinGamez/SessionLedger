'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useSessions } from '@/hooks/useSessions'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate, netVariant } from '@/lib/utils/format'
import type { Database } from '@/types/supabase'

type SessionRow = Database['public']['Tables']['sessions']['Row']

interface SessionsTableProps {
  isPro: boolean
}

export function SessionsTable({ isPro }: SessionsTableProps) {
  const { sessions, meta, loading, error, setFilter, filter } = useSessions({
    page: 1,
    limit: 20,
  })

  const [tagFilter, setTagFilter] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')

  const applyFilters = useCallback(() => {
    setFilter({
      page: 1,
      tag: tagFilter.trim() || undefined,
      from: fromFilter || undefined,
      to: toFilter || undefined,
    })
  }, [tagFilter, fromFilter, toFilter, setFilter])

  const clearFilters = useCallback(() => {
    setTagFilter('')
    setFromFilter('')
    setToFilter('')
    setFilter({ page: 1, tag: undefined, from: undefined, to: undefined })
  }, [setFilter])

  const handleExport = useCallback(async () => {
    const res = await fetch('/api/sessions/export')
    if (!res.ok) {
      const json = await res.json()
      alert(json.error ?? 'Export failed')
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ledgerstack-export-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const hasActiveFilter = !!(filter.tag || filter.from || filter.to)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            type="text"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Filter by tag"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 w-36"
          />
          <input
            type="date"
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
            title="From date"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          <input
            type="date"
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
            title="To date"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          <Button variant="secondary" size="sm" onClick={applyFilters}>
            Apply
          </Button>
          {hasActiveFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          {isPro ? (
            <Button variant="secondary" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          ) : (
            <span className="text-xs text-zinc-500 self-center">
              CSV export — Pro only
            </span>
          )}
          <Link href="/sessions/new">
            <Button variant="primary" size="sm">New Session</Button>
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          title="No sessions found"
          description={
            hasActiveFilter
              ? 'No sessions match your current filters.'
              : 'Start tracking your first session.'
          }
          action={
            hasActiveFilter
              ? { label: 'Clear filters', onClick: clearFilters }
              : { label: 'New Session', href: '/sessions/new' }
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    In
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Out
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Net
                  </th>
                  <th className="px-4 py-3 hidden lg:table-cell" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {sessions.map((session) => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} onPageChange={(p) => setFilter({ page: p })} />
          )}
        </>
      )}
    </div>
  )
}

// ---- Row ----
function SessionRow({ session }: { session: SessionRow }) {
  const net = session.out_amount - session.in_amount
  const variant = netVariant(net)

  const netColor = {
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    neutral: 'text-zinc-400',
  }[variant]

  return (
    <tr className="hover:bg-zinc-800/40 transition-colors group">
      <td className="px-4 py-3">
        <Link href={`/sessions/${session.id}`} className="hover:text-emerald-400 transition-colors">
          <span className="font-medium text-zinc-100">{session.title}</span>
        </Link>
        {session.tags && session.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {session.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
            {session.tags.length > 3 && (
              <Badge variant="default">+{session.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
        {formatDate(session.started_at)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
        {formatCurrency(session.in_amount)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-zinc-300">
        {formatCurrency(session.out_amount)}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums font-medium ${netColor}`}>
        {net >= 0 ? '+' : ''}{formatCurrency(net)}
      </td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">
        <Link
          href={`/sessions/${session.id}`}
          className="text-xs text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          Edit
        </Link>
      </td>
    </tr>
  )
}

// ---- Pagination ----
interface PaginationProps {
  meta: { page: number; totalPages: number; total: number; limit: number }
  onPageChange: (page: number) => void
}

function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = meta
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex items-center justify-between text-sm text-zinc-400">
      <span>
        {start}–{end} of {total} sessions
      </span>
      <div className="flex gap-1">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
