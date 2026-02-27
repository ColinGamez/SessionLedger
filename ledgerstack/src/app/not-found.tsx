import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-zinc-950">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-zinc-700">404</p>
        <h1 className="text-xl font-semibold text-zinc-100">Page not found</h1>
        <p className="text-zinc-500 text-sm">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-block mt-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
