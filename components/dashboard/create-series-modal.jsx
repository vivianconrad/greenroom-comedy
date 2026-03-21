'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { Button } from '@/components/ui/button'
import { createSeries } from '@/lib/actions/series'

const FREQUENCY_OPTIONS = [
  { value: 'Weekly', label: 'Weekly' },
  { value: 'Bi-weekly', label: 'Bi-weekly' },
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Irregular', label: 'Irregular / as-needed' },
]

const SHOW_TYPE_OPTIONS = [
  { value: 'Stand-up', label: 'Stand-up' },
  { value: 'Improv', label: 'Improv' },
  { value: 'Sketch', label: 'Sketch' },
  { value: 'Open mic', label: 'Open mic' },
  { value: 'Mixed bill', label: 'Mixed bill' },
  { value: 'Other', label: 'Other' },
]

export function CreateSeriesModal({ open, onClose }) {
  const [isOneOff, setIsOneOff] = useState(false)
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Pass the toggle state — FormData won't capture it automatically
    formData.set('is_one_off', String(isOneOff))

    startTransition(async () => {
      const result = await createSeries(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="New series">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Input
          label="Series name"
          name="name"
          placeholder="e.g. Tuesday Night Live"
          required
          autoFocus
        />

        <Toggle
          label="One-off show (not a recurring series)"
          checked={isOneOff}
          onChange={setIsOneOff}
        />

        {!isOneOff && (
          <Select
            label="Frequency"
            name="frequency"
            options={FREQUENCY_OPTIONS}
            placeholder="Select frequency…"
          />
        )}

        <Select
          label="Show type"
          name="show_type"
          options={SHOW_TYPE_OPTIONS}
          placeholder="Select type…"
        />

        <Input
          label="Venue"
          name="venue_name"
          placeholder="e.g. The Comedy Store"
        />

        {error && (
          <p role="alert" className="text-sm text-red font-body -mt-1">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Create series
          </Button>
        </div>
      </form>
    </Modal>
  )
}
