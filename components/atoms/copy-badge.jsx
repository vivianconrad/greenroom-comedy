'use client'

import { useCopyToClipboard } from '@/lib/hooks'
import { cn } from '@/lib/utils'

/**
 * A badge that copies its value to clipboard on click.
 * Shows a brief "Copied!" confirmation.
 */
export function CopyBadge({ label, value, className }) {
  const [copied, copy] = useCopyToClipboard(2000)

  return (
    <button
      type="button"
      onClick={() => copy(value)}
      title="Click to copy"
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-peach bg-cream text-sm font-body text-mid transition-colors hover:bg-peach active:scale-95',
        className
      )}
    >
      {label && <span className="text-soft/80">{label}</span>}
      <span
        aria-live="polite"
        className={cn('font-semibold tracking-wide transition-colors', copied ? 'text-sage' : 'text-deep')}
      >
        {copied ? 'Copied!' : value}
      </span>
    </button>
  )
}
