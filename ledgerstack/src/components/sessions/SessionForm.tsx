'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { formatDateTimeLocal } from '@/lib/utils/format'
import type { SessionCreateInput } from '@/lib/validators/session'

interface SessionFormProps {
  initialValues?: Partial<SessionCreateInput>
  sessionId?: string
  mode: 'create' | 'edit'
}

export function SessionForm({ initialValues, sessionId, mode }: SessionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<SessionCreateInput>({
    title: initialValues?.title ?? '',
    started_at: initialValues?.started_at
      ? formatDateTimeLocal(initialValues.started_at)
      : formatDateTimeLocal(new Date().toISOString()),
    in_amount: initialValues?.in_amount ?? 0,
    out_amount: initialValues?.out_amount ?? 0,
    notes: initialValues?.notes ?? null,
    tags: initialValues?.tags ?? [],
  })

  const [tagInput, setTagInput] = useState('')

  function set<K extends keyof SessionCreateInput>(field: K, value: SessionCreateInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !form.tags.includes(tag) && form.tags.length < 20) {
      set('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    set('tags', form.tags.filter((t) => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      started_at: new Date(form.started_at).toISOString(),
      in_amount: Number(form.in_amount),
      out_amount: Number(form.out_amount),
    }

    try {
      const url = mode === 'create' ? '/api/sessions' : `/api/sessions/${sessionId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        // Surface Zod field errors if present
        if (json.issues?.fieldErrors) {
          const first = Object.values(json.issues.fieldErrors as Record<string, string[]>)[0]
          setError(first?.[0] ?? json.error ?? 'Validation failed')
        } else {
          setError(json.error ?? 'Something went wrong')
        }
        setLoading(false)
        return
      }

      router.push('/sessions')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  // Live net preview
  const net = Number(form.out_amount) - Number(form.in_amount)
  const netColor = net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-zinc-400'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Title"
        type="text"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        placeholder="e.g. Morning poker session"
        required
      />

      <Input
        label="Session Date & Time"
        type="datetime-local"
        value={form.started_at as string}
        onChange={(e) => set('started_at', e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount In ($)"
          type="number"
          value={String(form.in_amount)}
          onChange={(e) => set('in_amount', Number(e.target.value))}
          min="0"
          step="0.01"
          required
        />
        <Input
          label="Amount Out ($)"
          type="number"
          value={String(form.out_amount)}
          onChange={(e) => set('out_amount', Number(e.target.value))}
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Live net preview */}
      {(Number(form.in_amount) > 0 || Number(form.out_amount) > 0) && (
        <p className="text-sm text-zinc-500">
          Net:{' '}
          <span className={`font-semibold tabular-nums ${netColor}`}>
            {net >= 0 ? '+' : ''}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(net)}
          </span>
        </p>
      )}

      <Textarea
        label="Notes"
        value={form.notes ?? ''}
        onChange={(e) => set('notes', e.target.value || null)}
        rows={4}
        placeholder="Optional session notes..."
        hint="Max 5,000 characters"
      />

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">Tags</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Type a tag, press Enter"
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
          />
          <Button type="button" variant="secondary" size="md" onClick={addTag}>
            Add
          </Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300"
              >
                <Badge>{tag}</Badge>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-zinc-500 hover:text-zinc-100 transition-colors ml-0.5 leading-none"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-zinc-600">{form.tags.length}/20 tags</p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" loading={loading}>
          {mode === 'create' ? 'Create Session' : 'Save Changes'}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
