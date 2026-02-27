import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SessionForm } from '@/components/sessions/SessionForm'
import { DeleteSessionButton } from '@/components/sessions/DeleteSessionButton'
import type { Metadata } from 'next'

type Props = { params: { id: string } }

export const metadata: Metadata = { title: 'Edit Session' }
export const dynamic = 'force-dynamic'

export default async function SessionDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !session) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Session</h1>
          <p className="text-zinc-400 text-sm mt-1">{session.title}</p>
        </div>
        <DeleteSessionButton sessionId={session.id} />
      </div>
      <SessionForm
        mode="edit"
        sessionId={session.id}
        initialValues={{
          title: session.title,
          started_at: session.started_at,
          in_amount: session.in_amount,
          out_amount: session.out_amount,
          notes: session.notes,
          tags: session.tags,
        }}
      />
    </div>
  )
}
