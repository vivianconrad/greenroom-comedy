'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const GAP = 8 // px between anchor and tooltip

function TooltipPortal({ anchorRef, visible, content, side, className }) {
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (!visible || !anchorRef.current) return
    const r = anchorRef.current.getBoundingClientRect()
    if (side === 'top')    setCoords({ top: r.top - GAP,    left: r.left + r.width / 2,  origin: 'bottom center' })
    if (side === 'bottom') setCoords({ top: r.bottom + GAP, left: r.left + r.width / 2,  origin: 'top center'    })
    if (side === 'left')   setCoords({ top: r.top + r.height / 2, left: r.left - GAP,   origin: 'right center'  })
    if (side === 'right')  setCoords({ top: r.top + r.height / 2, left: r.right + GAP,  origin: 'left center'   })
  }, [visible, side, anchorRef])

  if (!visible || !coords) return null

  const translateMap = {
    top:    '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left:   '-translate-x-full -translate-y-1/2',
    right:  '-translate-y-1/2',
  }

  const arrowMap = {
    top:    'absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-deep',
    bottom: 'absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-deep',
    left:   'absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-deep',
    right:  'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-deep',
  }

  return createPortal(
    <span
      role="tooltip"
      style={{ top: coords.top, left: coords.left, position: 'fixed', zIndex: 9999 }}
      className={cn(
        'w-max max-w-64 px-3 py-2 rounded-lg',
        'bg-deep text-cream text-xs font-body leading-snug',
        'shadow-lg pointer-events-none',
        translateMap[side],
        className
      )}
    >
      {content}
      <span aria-hidden="true" className={arrowMap[side]} />
    </span>,
    document.body
  )
}

// ─── Tooltip wrapper ──────────────────────────────────────────────────────────

function Tooltip({ children, content, side = 'top', className }) {
  const [visible, setVisible] = useState(false)
  const anchorRef = useRef(null)

  if (!content) return children

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <TooltipPortal
        anchorRef={anchorRef}
        visible={visible}
        content={content}
        side={side}
        className={className}
      />
    </span>
  )
}

// ─── Info icon tooltip ────────────────────────────────────────────────────────

function InfoTooltip({ content, side = 'top', className }) {
  return (
    <Tooltip content={content} side={side} className={className}>
      <span
        role="img"
        aria-label="More information"
        className="inline-flex items-center justify-center text-soft/40 hover:text-soft/70 transition-colors rounded-full cursor-default"
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
      </span>
    </Tooltip>
  )
}

export { Tooltip, InfoTooltip }
