import { redirect } from 'next/navigation'

// Root "/" redirects authenticated users to dashboard,
// unauthenticated users to login (middleware handles the guard).
export default function RootPage() {
  redirect('/dashboard')
}
