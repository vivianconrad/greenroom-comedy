'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * A simple three-dot-style dropdown menu.
 *
 * Props:
 *   trigger  — the icon/content rendered inside the toggle button
 *   items    — array of { label, onClick, danger? } or { separator: true }
 *   align    — 'right' (default) | 'left'
 */
export function DropdownMenu({ trigger, items, align = 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="More options"
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-mid hover:bg-peach active:bg-peach focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mid transition-colors"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-44 rounded-lg border border-light bg-white shadow-md py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.separator ? (
              <hr key={i} className="my-1 border-light" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm font-body transition-colors',
                  item.danger
                    ? 'text-red hover:bg-red/5'
                    : 'text-deep hover:bg-peach'
                )}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
