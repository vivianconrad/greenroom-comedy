'use client'

import { useState, useTransition, useMemo } from 'react'
import { Modal } from '@/components/atoms/modal'
import { Button } from '@/components/atoms/button'
import { cn } from '@/lib/utils'
import { mergePerformers } from '@/lib/actions/performers'

const FIELDS = [
  { key: 'name',            label: 'Name',           required: true },
  { key: 'stage_name',      label: 'Stage name' },
  { key: 'pronouns',        label: 'Pronouns' },
  { key: 'act_type',        label: 'Act type' },
  { key: 'instagram',       label: 'Instagram' },
  { key: 'email',           label: 'Email' },
  { key: 'contact_method',  label: 'Contact method' },
  { key: 'how_we_met',      label: 'How we met' },
  { key: 'clip_url',        label: 'Clip URL' },
  { key: 'book_again',      label: 'Book again',     type: 'boolean' },
  { key: 'audience_favourite', label: 'Audience fav', type: 'boolean' },
]

function formatValue(value, type) {
  if (value == null) return null
  if (type === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

export function MergePerformersModal({ open, onClose, performers, onSuccess }) {
  const [a, b] = performers || []

  // Default choices: prefer whichever side has a value; if both do, prefer 'a'
  const [choices, setChoices] = useState(() => {
    if (!a || !b) return {}
    const init = {}
    for (const f of FIELDS) {
      init[f.key] = !a[f.key] && b[f.key] ? 'b' : 'a'
    }
    return init
  })

  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  if (!a || !b) return null

  // keepId is always a.id — the record that gets updated in place.
  // The field choices determine what values end up on that record.
  const keepId = a.id
  const deleteId = b.id

  const differingFields = useMemo(
    () =>
      FIELDS.filter((f) => {
        const va = formatValue(a[f.key], f.type)
        const vb = formatValue(b[f.key], f.type)
        return va !== vb // includes null vs non-null
      }),
    [a, b]
  )

  const matchingFields = useMemo(
    () =>
      FIELDS.filter((f) => {
        const va = formatValue(a[f.key], f.type)
        const vb = formatValue(b[f.key], f.type)
        return va !== null && va === vb
      }),
    [a, b]
  )

  const mergedTags = [...new Set([...(a.tags || []), ...(b.tags || [])])].filter(Boolean)
  const bothHaveNotes = !!(a.notes && b.notes)

  function choose(fieldKey, side) {
    setChoices((prev) => ({ ...prev, [fieldKey]: side }))
  }

  function handleConfirm() {
    setError(null)
    const profileData = {}
    for (const f of FIELDS) {
      const side = choices[f.key] || 'a'
      profileData[f.key] = (side === 'a' ? a : b)[f.key] ?? null
    }

    startTransition(async () => {
      const result = await mergePerformers(keepId, deleteId, profileData)
      if (result?.error) {
        setError(result.error)
        return
      }
      onSuccess?.()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={isPending ? undefined : onClose} title="Merge performers">
      <div className="flex flex-col gap-4">

        {/* Column headers */}
        <div className="grid grid-cols-[100px_1fr_1fr] text-xs font-semibold font-body text-soft uppercase tracking-wide">
          <div />
          <div className="px-3 truncate">{a.name}</div>
          <div className="px-3 truncate">{b.name}</div>
        </div>

        {/* Field-by-field selection */}
        {differingFields.length > 0 ? (
          <div className="border border-peach rounded-lg overflow-hidden divide-y divide-peach">
            {differingFields.map((f) => {
              const va = formatValue(a[f.key], f.type)
              const vb = formatValue(b[f.key], f.type)
              const pickA = choices[f.key] !== 'b'

              return (
                <div key={f.key} className="grid grid-cols-[100px_1fr_1fr] items-stretch text-sm font-body">
                  <div className="px-3 py-2.5 bg-cream/60 flex items-center text-xs text-soft font-medium border-r border-peach">
                    {f.label}
                  </div>
                  <button
                    type="button"
                    onClick={() => choose(f.key, 'a')}
                    className={cn(
                      'px-3 py-2.5 text-left transition-colors border-r border-peach',
                      pickA ? 'bg-coral/10 text-deep font-medium' : 'text-mid hover:bg-cream/50',
                      !va && 'text-soft/40 italic'
                    )}
                  >
                    {va ?? '—'}
                  </button>
                  <button
                    type="button"
                    onClick={() => choose(f.key, 'b')}
                    className={cn(
                      'px-3 py-2.5 text-left transition-colors',
                      !pickA ? 'bg-coral/10 text-deep font-medium' : 'text-mid hover:bg-cream/50',
                      !vb && 'text-soft/40 italic'
                    )}
                  >
                    {vb ?? '—'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-soft font-body text-center py-1">All profile fields are identical.</p>
        )}

        {/* Matching fields (informational) */}
        {matchingFields.length > 0 && (
          <p className="text-xs text-soft/70 font-body">
            Also the same in both:{' '}
            {matchingFields.map((f) => f.label).join(', ')}
          </p>
        )}

        {/* Always-merged fields */}
        <div className="rounded-lg bg-cream border border-peach px-4 py-3 text-sm font-body text-mid space-y-1">
          <p className="text-xs font-semibold text-soft uppercase tracking-wide mb-2">Always combined</p>
          <p>
            <span className="font-medium text-deep">Tags: </span>
            {mergedTags.length > 0 ? mergedTags.join(', ') : <span className="text-soft/50">none</span>}
          </p>
          <p>
            <span className="font-medium text-deep">Notes: </span>
            {bothHaveNotes
              ? 'Both have notes — joined with a separator'
              : a.notes || b.notes
              ? 'Carried over from whichever has them'
              : <span className="text-soft/50">none</span>}
          </p>
          <p>
            <span className="font-medium text-deep">Show history & series: </span>
            All moved to merged entry
          </p>
        </div>

        {error && <p className="text-sm text-red font-body">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleConfirm} loading={isPending}>
            Merge
          </Button>
        </div>
      </div>
    </Modal>
  )
}
