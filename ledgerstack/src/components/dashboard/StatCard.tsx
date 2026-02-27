interface StatCardProps {
  label: string
  value: string
  subtext?: string
  variant?: 'positive' | 'negative' | 'neutral'
}

const variantClasses = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-zinc-100',
}

export function StatCard({ label, value, subtext, variant = 'neutral' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-1">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${variantClasses[variant]}`}>
        {value}
      </p>
      {subtext && (
        <p className="text-xs text-zinc-500">{subtext}</p>
      )}
    </div>
  )
}
