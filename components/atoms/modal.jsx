'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function Modal({ open = false, onClose, title, children, className }) {
  const overlayRef = useRef(null)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)

  // Save focus trigger on open
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
    }
  }, [open])

  // Focus first focusable element when opened
  useEffect(() => {
    if (!open || !dialogRef.current) return
    const first = dialogRef.current.querySelector(FOCUSABLE)
    first?.focus()
  }, [open])

  // Restore focus on close
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE))
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose?.()
    },
    [onClose]
  )

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative w-full max-w-lg bg-white rounded-card-lg shadow-xl',
          'flex flex-col max-h-[90vh]',
          className
        )}
      >
        {/* header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-peach">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-deep font-display"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-soft hover:bg-peach hover:text-deep transition-colors"
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
        {/* body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export { Modal }
