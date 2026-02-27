import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, netVariant } from '@/lib/utils/format'

type Session = {
  id: string
  title: string
  started_at: string
  in_amount: number
  out_amount: number
  tags: string[]
}

export function RecentSessions({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Record your first session to start tracking performance."
        action={{ label: 'New Session', href: '/sessions/new' }}
      />
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
      {sessions.map((s) => {
        const net = s.out_amount - s.in_amount
        const variant = netVariant(net)
        const netColor = {
          positive: 'text-emerald-400',
          negative: 'text-red-400',
          neutral: 'text-zinc-400',
        }[variant]

        return (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                {s.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-zinc-500">{formatDate(s.started_at)}</span>
                {s.tags?.slice(0, 2).map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div className="text-right ml-4 shrink-0 space-y-0.5">
              <p className={`text-sm font-semibold tabular-nums ${netColor}`}>
                {net >= 0 ? '+' : ''}{formatCurrency(net)}
              </p>
              <p className="text-xs text-zinc-500 tabular-nums">
                In {formatCurrency(s.in_amount)}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
