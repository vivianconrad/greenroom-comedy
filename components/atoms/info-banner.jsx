'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A dismissible info banner.
 *
 * @param {string}    [variant]   — 'yellow' (default) | 'blue' | 'neutral'
 * @param {ReactNode} children
 * @param {string}    [className]
 */
export function InfoBanner({ variant = 'yellow', children, className }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const variants = {
    yellow:  'bg-butter/60 border-butter text-mid',
    blue:    'bg-sky-50 border-sky-200 text-sky-800',
    neutral: 'bg-cream border-peach text-mid',
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-body',
        variants[variant] ?? variants.yellow,
        className
      )}
    >
      <div>{children}</div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 mt-0.5 text-soft/50 hover:text-soft transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
        </svg>
      </button>
    </div>
  )
}
