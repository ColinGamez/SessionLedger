'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
    started_at: initialValues?.started_at ?? new Date().toISOString().slice(0, 16),
    in_amount: initialValues?.in_amount ?? 0,
    out_amount: initialValues?.out_amount ?? 0,
    notes: initialValues?.notes ?? null,
    tags: initialValues?.tags ?? [],
  })

  const [tagInput, setTagInput] = useState('')

  function handleChange(field: keyof SessionCreateInput, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag) && form.tags.length < 20) {
      handleChange('tags', [...form.tags, tag])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    handleChange('tags', form.tags.filter((t) => t !== tag))
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
        setError(json.error ?? 'Something went wrong')
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Title */}
      <Field label="Title" required>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g. Morning poker session"
          className={inputClass}
          required
        />
      </Field>

      {/* Started at */}
      <Field label="Session Date & Time" required>
        <input
          type="datetime-local"
          value={
            typeof form.started_at === 'string' && form.started_at.length > 16
              ? form.started_at.slice(0, 16)
              : form.started_at
          }
          onChange={(e) => handleChange('started_at', e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount In ($)" required>
          <input
            type="number"
            value={form.in_amount}
            onChange={(e) => handleChange('in_amount', e.target.value)}
            min="0"
            step="0.01"
            className={inputClass}
            required
          />
        </Field>
        <Field label="Amount Out ($)" required>
          <input
            type="number"
            value={form.out_amount}
            onChange={(e) => handleChange('out_amount', e.target.value)}
            min="0"
            step="0.01"
            className={inputClass}
            required
          />
        </Field>
      </div>

      {/* Notes */}
      <Field label="Notes">
        <textarea
          value={form.notes ?? ''}
          onChange={(e) => handleChange('notes', e.target.value || null)}
          rows={4}
          placeholder="Optional session notes..."
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="space-y-2">
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
              placeholder="Add a tag and press Enter"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Add
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Session' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors'
