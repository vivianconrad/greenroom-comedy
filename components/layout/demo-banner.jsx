'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const DEMO_EMAIL = 'demo@greenroom.app'

export function DemoBanner({ userEmail }) {
  const router = useRouter()
  const [resetting, startReset] = useTransition()

  if (userEmail !== DEMO_EMAIL) return null

  function handleReset() {
    startReset(async () => {
      await fetch('/api/demo/reset', { method: 'POST' })
      router.refresh()
    })
  }

  return (
    <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-coral text-cream text-sm font-body">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold shrink-0">Demo Mode</span>
        <span className="text-cream/80 hidden sm:inline">— changes won&apos;t be saved</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleReset}
          disabled={resetting}
          className="text-xs underline underline-offset-2 text-cream/80 hover:text-cream transition-colors disabled:opacity-50"
        >
          {resetting ? 'Resetting…' : 'Reset demo data'}
        </button>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center h-7 px-3 rounded-lg text-xs font-semibold
            bg-cream text-coral hover:bg-cream/90 transition-colors"
        >
          Sign up for real
        </Link>
      </div>
    </div>
  )
}
