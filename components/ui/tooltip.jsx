'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────
// Wrap any element to give it a hover/focus tooltip.

function Tooltip({ children, content, side = 'top', className }) {
  const [visible, setVisible] = useState(false)

  if (!content) return children

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 w-max max-w-64 px-3 py-2 rounded-lg',
            'bg-deep text-cream text-xs font-body leading-snug',
            'shadow-lg pointer-events-none',
            side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
            side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
            side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
            side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
            className
          )}
        >
          {content}
          {/* Arrow */}
          {side === 'top' && (
            <span
              aria-hidden="true"
              className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-deep"
            />
          )}
          {side === 'bottom' && (
            <span
              aria-hidden="true"
              className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-deep"
            />
          )}
        </span>
      )}
    </span>
  )
}

// ─── Info icon tooltip ────────────────────────────────────────────────────────
// A small ⓘ icon that shows a tooltip on hover/focus.

function InfoTooltip({ content, side = 'top', className }) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <button
        type="button"
        tabIndex={0}
        className="inline-flex items-center justify-center text-soft/40 hover:text-soft/70 transition-colors rounded-full cursor-default"
        aria-label="More information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </Tooltip>
  )
}

export { Tooltip, InfoTooltip }
