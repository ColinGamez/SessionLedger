import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { SessionUpdateSchema } from '@/lib/validators/session'

type RouteContext = { params: { id: string } }

// ----------------------------------------------------------------
// GET /api/sessions/:id
// ----------------------------------------------------------------
export async function GET(_req: Request, { params }: RouteContext) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id) // redundant with RLS — defense in depth
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// ----------------------------------------------------------------
// PATCH /api/sessions/:id
// ----------------------------------------------------------------
export async function PATCH(req: Request, { params }: RouteContext) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parseResult = SessionUpdateSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parseResult.error.flatten() },
      { status: 422 }
    )
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(parseResult.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Session not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ data })
}

// ----------------------------------------------------------------
// DELETE /api/sessions/:id
// ----------------------------------------------------------------
export async function DELETE(_req: Request, { params }: RouteContext) {
  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[sessions:DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
