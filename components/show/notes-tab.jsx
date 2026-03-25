'use client'

import { useState, useRef, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { updateShowNotes } from '@/lib/actions/show'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

const ENERGY_OPTIONS = ['Low', 'Warm', 'Engaged', 'Rowdy', 'Electric']

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          className={cn(
            'text-2xl leading-none transition-colors',
            value != null && value >= star ? 'text-amber' : 'text-soft/25 hover:text-amber/60'
          )}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function NotesTab({ show }) {
  const [, startTransition] = useTransition()
  const timerRef = useRef(null)
  const dataRef = useRef(null)
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState(null)

  const [localData, setLocalData] = useState({
    notes_attendance: show.notes_attendance ?? '',
    notes_rating: show.notes_rating ?? null,
    notes_energy: show.notes_energy ?? null,
    notes_worked: show.notes_worked ?? '',
    notes_didnt_work: show.notes_didnt_work ?? '',
    notes_next_time: show.notes_next_time ?? '',
  })

  // Keep ref in sync for debounced save closure
  dataRef.current = localData

  function applySaveResult(result) {
    if (result?.error) {
      setSaveError(result.error)
    } else {
      setSaved(true)
    }
  }

  function triggerAutoSave() {
    setSaved(false)
    setSaveError(null)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        applySaveResult(await updateShowNotes(show.id, dataRef.current))
      })
    }, 800)
  }

  function handleChange(field, value) {
    setLocalData((prev) => ({ ...prev, [field]: value }))
    triggerAutoSave()
  }

  function handleManualSave() {
    clearTimeout(timerRef.current)
    setSaveError(null)
    startTransition(async () => {
      applySaveResult(await updateShowNotes(show.id, localData))
    })
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg text-deep">Post-show notes</h3>
        <div className="flex items-center gap-3">
          {saveError
            ? <span className="text-xs text-red font-body">{saveError}</span>
            : <span className="text-xs text-soft">{saved ? 'Saved' : 'Saving…'}</span>
          }
          <Button variant="secondary" size="sm" onClick={handleManualSave}>
            Save
          </Button>
        </div>
      </div>

      <Input
        label="Attendance"
        type="number"
        min="0"
        value={localData.notes_attendance}
        onChange={(e) => handleChange('notes_attendance', e.target.value)}
        placeholder="How many people showed up?"
      />

      <div>
        <label className="block text-sm font-medium text-deep mb-2">Rating</label>
        <StarRating
          value={localData.notes_rating}
          onChange={(val) => handleChange('notes_rating', val)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-deep mb-2">Audience energy</label>
        <div className="flex gap-2 flex-wrap">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                handleChange(
                  'notes_energy',
                  localData.notes_energy === opt ? null : opt
                )
              }
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                localData.notes_energy === opt
                  ? 'bg-coral text-cream border-coral'
                  : 'bg-white text-mid border-peach hover:bg-peach/50'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <Textarea
        label="What worked"
        value={localData.notes_worked}
        onChange={(e) => handleChange('notes_worked', e.target.value)}
        placeholder="Bits that landed, crowd favourites, smooth transitions…"
        rows={3}
      />

      <Textarea
        label="What didn't work"
        value={localData.notes_didnt_work}
        onChange={(e) => handleChange('notes_didnt_work', e.target.value)}
        placeholder="Timing issues, jokes that bombed, tech problems…"
        rows={3}
      />

      <Textarea
        label="Notes for next time"
        value={localData.notes_next_time}
        onChange={(e) => handleChange('notes_next_time', e.target.value)}
        placeholder="Reminders and improvements for the next show…"
        rows={3}
      />
    </div>
  )
}
