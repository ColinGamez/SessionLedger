'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

interface ProfileSectionProps {
  email: string
  fullName: string
}

export function ProfileSection({ email, fullName }: ProfileSectionProps) {
  const [name, setName] = useState(fullName)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = getSupabaseBrowserClient()
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name },
    })

    if (authError) {
      setError(authError.message)
    } else {
      // Also update profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: name })
          .eq('id', user.id)
      }
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwLoading(true)
    setPwError(null)
    setPwSuccess(false)

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters')
      setPwLoading(false)
      return
    }

    const supabase = getSupabaseBrowserClient()

    // Re-authenticate first to verify current password
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setPwError('Could not verify current user')
      setPwLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (signInError) {
      setPwError('Current password is incorrect')
      setPwLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setPwError(updateError.message)
    } else {
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
    }
    setPwLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>

        <form onSubmit={handleUpdateName} className="space-y-4">
          <Input
            label="Display Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <p className="text-sm text-zinc-300 mt-0.5">{email}</p>
            <p className="text-xs text-zinc-600 mt-0.5">Email cannot be changed here.</p>
          </div>

          {success && <Alert variant="success">Profile updated.</Alert>}
          {error && <Alert variant="error">{error}</Alert>}

          <Button type="submit" variant="primary" size="md" loading={loading}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            hint="Minimum 8 characters"
          />

          {pwSuccess && <Alert variant="success">Password updated successfully.</Alert>}
          {pwError && <Alert variant="error">{pwError}</Alert>}

          <Button type="submit" variant="primary" size="md" loading={pwLoading}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  )
}
