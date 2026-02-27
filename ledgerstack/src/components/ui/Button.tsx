import { forwardRef } from 'react'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold disabled:bg-emerald-500/50',
  secondary:
    'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 disabled:opacity-50',
  danger:
    'border border-red-500/40 bg-transparent hover:bg-red-500/10 text-red-400 disabled:opacity-50',
  ghost:
    'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-50',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-md transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60',
          'disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {loading && <Spinner size="sm" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
