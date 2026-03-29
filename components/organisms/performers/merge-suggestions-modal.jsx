'use client'

import { useState } from 'react'
import { Modal } from '@/components/atoms/modal'
import { Button } from '@/components/atoms/button'
import { Pill } from '@/components/atoms/pill'
import { MergePerformersModal } from './merge-performers-modal'

export function MergeSuggestionsModal({ open, onClose, suggestions, onMerged }) {
  const [mergePair, setMergePair] = useState(null)
  // Track which pairs have been resolved so they disappear from the list
  const [dismissed, setDismissed] = useState(new Set())

  const remaining = suggestions.filter(
    (s) => !dismissed.has(`${s.a.id}:${s.b.id}`)
  )

  function dismiss(a, b) {
    setDismissed((prev) => new Set([...prev, `${a.id}:${b.id}`]))
  }

  function handleMerged(a, b) {
    dismiss(a, b)
    onMerged?.()
    setMergePair(null)
  }

  if (mergePair) {
    return (
      <MergePerformersModal
        open
        onClose={() => setMergePair(null)}
        performers={[mergePair.a, mergePair.b]}
        onSuccess={() => handleMerged(mergePair.a, mergePair.b)}
      />
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        remaining.length > 0
          ? `Possible duplicates (${remaining.length})`
          : 'No duplicates found'
      }
    >
      <div className="flex flex-col gap-3">
        {remaining.length === 0 ? (
          <p className="text-sm text-soft font-body py-4 text-center">
            {suggestions.length === 0
              ? 'No potential duplicates were found in your performers list.'
              : 'All suggestions have been resolved.'}
          </p>
        ) : (
          <>
            <p className="text-sm text-mid font-body">
              These performers may be duplicates. Review each pair and merge or dismiss.
            </p>
            <div className="flex flex-col divide-y divide-peach border border-peach rounded-lg overflow-hidden">
              {remaining.map(({ a, b, reasons }) => (
                <div key={`${a.id}:${b.id}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-medium text-deep font-body text-sm">{a.name}</span>
                      <span className="text-soft/50 text-xs font-body">+</span>
                      <span className="font-medium text-deep font-body text-sm">{b.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reasons.map((r) => (
                        <Pill key={r} variant="neutral">{r}</Pill>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setMergePair({ a, b })}
                    >
                      Review
                    </Button>
                    <button
                      type="button"
                      onClick={() => dismiss(a, b)}
                      className="text-xs text-soft hover:text-mid font-body transition-colors"
                      aria-label="Not duplicates"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="flex justify-end">
          <Button variant="ghost" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
