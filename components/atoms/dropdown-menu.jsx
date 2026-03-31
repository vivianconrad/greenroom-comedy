'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Focus first item when menu opens
  useEffect(() => {
    if (open && menuRef.current) {
      const first = menuRef.current.querySelector('[role="menuitem"]')
      first?.focus()
    }
  }, [open])

  const handleMenuKeyDown = useCallback((e) => {
    if (!menuRef.current) return
    const menuItems = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
    const currentIndex = menuItems.indexOf(document.activeElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = menuItems[(currentIndex + 1) % menuItems.length]
      next?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = menuItems[(currentIndex - 1 + menuItems.length) % menuItems.length]
      prev?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      menuItems[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      menuItems[menuItems.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More options"
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-mid hover:bg-peach active:bg-peach focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mid transition-colors"
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute z-50 mt-1 min-w-44 rounded-lg border border-peach bg-white shadow-md py-1',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.separator ? (
              <hr key={i} className="my-1 border-peach" />
            ) : (
              <button
                key={i}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                  triggerRef.current?.focus()
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm font-body transition-colors focus:outline-none focus:bg-peach',
                  item.danger
                    ? 'text-red hover:bg-red/5 focus:bg-red/5'
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
