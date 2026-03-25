'use client'

import { useState, useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Inline text input with autocomplete suggestions from contacts + "Me".
 * Saves on blur or Enter. Always visible as a subtle input field.
 */
export function InlinePersonInput({ value, onSave, contacts = [], placeholder = '+ Assign' }) {
  const [local, setLocal] = useState(value ?? '')
  const listId = useId()
  const suggestions = ['Me', ...contacts.map((c) => c.name)]
  const isEmpty = !local.trim()

  function handleBlur() {
    const trimmed = local.trim()
    const current = value ?? ''
    if (trimmed !== current) onSave(trimmed || null)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') {
      setLocal(value ?? '')
      e.currentTarget.blur()
    }
  }

  return (
    <>
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        list={listId}
        autoComplete="off"
        placeholder={placeholder}
        className={cn(
          'w-full min-w-0 text-xs font-body rounded-md border px-2 py-1 transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-coral/30 focus:border-coral/50 focus:bg-white',
          isEmpty
            ? 'border-dashed border-peach bg-transparent text-soft placeholder:text-soft/60 hover:border-soft/50 hover:bg-cream/50'
            : 'border-peach bg-cream text-deep hover:border-soft/50'
        )}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  )
}
