import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/utils/plan'

export const dynamic = 'force-dynamic'

// ----------------------------------------------------------------
// GET /api/sessions/export — CSV export (Pro only)
// ----------------------------------------------------------------
export async function GET() {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Gate behind Pro plan
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_period_end')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const { canExport } = getUserPlan(profile)
  if (!canExport) {
    return NextResponse.json(
      { error: 'CSV export is a Pro feature. Please upgrade your plan.' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  const csv = buildCsv(data ?? [])

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="sessionledger-export-${Date.now()}.csv"`,
    },
  })
}

type SessionRow = {
  id: string
  title: string
  started_at: string
  in_amount: number
  out_amount: number
  notes: string | null
  tags: string[]
  created_at: string
}

function buildCsv(rows: SessionRow[]): string {
  const HEADERS = ['id', 'title', 'started_at', 'in_amount', 'out_amount', 'net', 'notes', 'tags', 'created_at']

  const escape = (v: unknown): string => {
    const s = v === null || v === undefined ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines: string[] = [HEADERS.join(',')]

  for (const row of rows) {
    lines.push(
      [
        escape(row.id),
        escape(row.title),
        escape(row.started_at),
        escape(row.in_amount),
        escape(row.out_amount),
        escape(row.out_amount - row.in_amount),
        escape(row.notes),
        escape((row.tags ?? []).join('; ')),
        escape(row.created_at),
      ].join(',')
    )
  }

  return lines.join('\n')
}
