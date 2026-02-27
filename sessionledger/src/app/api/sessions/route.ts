import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import {
  SessionCreateSchema,
  SessionQuerySchema,
} from '@/lib/validators/session'
import {
  assertSessionLimitNotReached,
  PlanLimitError,
} from '@/lib/utils/plan'

export const dynamic = 'force-dynamic'

// ----------------------------------------------------------------
// GET /api/sessions — paginated list with optional tag + date filter
// ----------------------------------------------------------------
export async function GET(req: Request) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const parseResult = SessionQuerySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  )

  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', issues: parseResult.error.flatten() },
      { status: 400 }
    )
  }

  const { page, limit, tag, from, to } = parseResult.data
  const offset = (page - 1) * limit

  let query = supabase
    .from('sessions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tag) {
    query = query.contains('tags', [tag])
  }
  if (from) {
    query = query.gte('started_at', from)
  }
  if (to) {
    query = query.lte('started_at', to)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[sessions:GET]', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    meta: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

// ----------------------------------------------------------------
// POST /api/sessions — create new session
// ----------------------------------------------------------------
export async function POST(req: Request) {
  const supabase = createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = SessionCreateSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parseResult.error.flatten() },
      { status: 422 }
    )
  }

  // ---- Enforce plan limit ----
  try {
    await assertSessionLimitNotReached(supabase, user.id)
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to verify plan' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ ...parseResult.data, user_id: user.id })
    .select()
    .single()

  if (error) {
    console.error('[sessions:POST]', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
