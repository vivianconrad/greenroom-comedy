'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline combobox for adding a performer from the database.
 *
 * Props:
 *   performers  — array of { id, name, stage_name, act_type, instagram, clip_url }
 *   onSelect    — called with performerId when a performer is chosen
 *   onClose     — called when the combobox should be dismissed
 *   isPending   — disables interaction while a request is in flight
 *   error       — error string to display
 *   placeholder — input placeholder text
 */
export function PerformerCombobox({
  performers = [],
  onSelect,
  onClose,
  isPending = false,
  error = null,
  placeholder = 'Search performers…',
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on click outside
  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [onClose])

  const filtered = query.trim()
    ? performers.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.stage_name?.toLowerCase().includes(query.toLowerCase())
      )
    : performers

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose?.()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isPending}
        className={cn(
          'w-full h-9 px-3 text-sm rounded-lg border border-peach bg-white text-deep',
          'placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral',
          'disabled:opacity-50'
        )}
      />

      <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-peach rounded-lg shadow-md max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-sm text-soft/60 font-body">
            {performers.length === 0
              ? 'No performers in your database yet.'
              : 'No performers match your search.'}
          </p>
        ) : (
          <ul>
            {filtered.map((p) => (
              <li key={p.id} className="border-b border-peach last:border-0">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onSelect(p.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-peach/50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-deep font-body">{p.name}</span>
                      {p.stage_name && (
                        <span className="text-xs text-soft/60 font-body">"{p.stage_name}"</span>
                      )}
                      {p.act_type && (
                        <span className="text-xs text-soft/60 font-body">{p.act_type}</span>
                      )}
                    </div>
                    {p.instagram && (
                      <span className="text-xs text-soft/60 font-body">@{p.instagram.replace('@', '')}</span>
                    )}
                  </div>
                  <span className="text-xs text-coral font-body shrink-0 ml-3">Add →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red font-body">{error}</p>
      )}
    </div>
  )
}
