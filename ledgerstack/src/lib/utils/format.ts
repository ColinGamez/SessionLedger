// ----------------------------------------------------------------
// Shared formatting utilities — pure functions, no side effects
// ----------------------------------------------------------------

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`
  }
  return formatCurrency(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDateTimeLocal(iso: string): string {
  // Returns "YYYY-MM-DDTHH:mm" for datetime-local inputs
  return new Date(iso).toISOString().slice(0, 16)
}

/** Returns positive / negative / neutral for coloring */
export function netVariant(net: number): 'positive' | 'negative' | 'neutral' {
  if (net > 0) return 'positive'
  if (net < 0) return 'negative'
  return 'neutral'
}
