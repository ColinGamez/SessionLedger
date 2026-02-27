type AlertVariant = 'error' | 'warning' | 'success' | 'info'

interface AlertProps {
  variant?: AlertVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<AlertVariant, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
}

export function Alert({ variant = 'error', children, className = '' }: AlertProps) {
  return (
    <div
      role="alert"
      className={[
        'rounded-md border p-3 text-sm',
        variantStyles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
