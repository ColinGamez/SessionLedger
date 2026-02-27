import Link from 'next/link'

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
      <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center">
        <p className="text-zinc-500 text-sm">No sessions yet.</p>
        <Link
          href="/sessions/new"
          className="mt-3 inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          Create your first session
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
      {sessions.map((s) => {
        const net = s.out_amount - s.in_amount
        const isPositive = net >= 0

        return (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="space-y-0.5 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                {s.title}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-zinc-500">
                  {new Date(s.started_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                {s.tags?.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded text-xs bg-zinc-800 text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right ml-4 shrink-0">
              <p className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{formatCurrency(net)}
              </p>
              <p className="text-xs text-zinc-500">
                In: {formatCurrency(s.in_amount)}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}
