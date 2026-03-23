'use client'

import { useState, useTransition, useId } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createSeries } from '@/lib/actions/series'

// ─── Radio pill group ─────────────────────────────────────────────────────────

function RadioGroup({ name, options, value, onChange, columns = false }) {
  const groupId = useId()
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        columns && 'grid grid-cols-2 sm:grid-cols-3'
      )}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body cursor-pointer select-none transition-colors',
            value === opt.value
              ? 'border-coral bg-coral/10 text-coral font-medium'
              : 'border-peach bg-cream text-mid hover:border-soft hover:bg-peach'
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <span className="text-sm font-medium text-soft font-body">
      {children}
      {required && <span className="text-red ml-0.5" aria-hidden>*</span>}
    </span>
  )
}

// ─── Options ──────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: 'one_off', label: 'One-off' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
]

const SHOW_TYPE_OPTIONS = [
  { value: 'variety', label: 'Variety Show' },
  { value: 'standup', label: 'Stand-up Showcase' },
  { value: 'open_mic', label: 'Open Mic' },
  { value: 'sketch', label: 'Sketch / Improv' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

export function CreateSeriesModal({ open, onClose }) {
  const [frequency, setFrequency] = useState('monthly')
  const [showType, setShowType] = useState('')
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  const isOneOff = frequency === 'one_off'

  function reset() {
    setFrequency('monthly')
    setShowType('')
    setErrors({})
  }

  function handleClose() {
    if (isPending) return
    reset()
    onClose()
  }

  function validate(formData) {
    const errs = {}
    if (!formData.get('name')?.toString().trim()) {
      errs.name = 'Series name is required.'
    }
    if (!showType) {
      errs.show_type = 'Select a show type.'
    }
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const errs = validate(formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    // Inject radio group values that aren't native <input name> fields
    formData.set('frequency', frequency)
    formData.set('show_type', showType)

    startTransition(async () => {
      // createSeries calls redirect() on success — no return value to handle
      const result = await createSeries(formData)
      if (result?.error) setErrors({ form: result.error })
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="New series">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

        {/* Name */}
        <Input
          label="Series name"
          name="name"
          placeholder="e.g. Tuesday Night Live"
          error={errors.name}
          autoFocus
          required
        />

        {/* Frequency */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>Frequency</FieldLabel>
          <RadioGroup
            name="frequency"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={setFrequency}
          />
          <p className="text-xs text-soft font-body mt-0.5">
            One-offs can be converted to recurring later.
          </p>
        </div>

        {/* Show type */}
        <div className="flex flex-col gap-2">
          <FieldLabel required>Show type</FieldLabel>
          <RadioGroup
            name="show_type"
            options={SHOW_TYPE_OPTIONS}
            value={showType}
            onChange={setShowType}
            columns
          />
          {errors.show_type && (
            <p className="text-xs text-red font-body">{errors.show_type}</p>
          )}
        </div>

        {/* Default venue */}
        <Input
          label="Default venue"
          name="venue"
          placeholder="e.g. The Comedy Store"
        />

        {/* Default times */}
        <div className="flex flex-col gap-2">
          <FieldLabel>Default times</FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Call time" name="call_time" type="time" />
            <Input label="Doors" name="doors_time" type="time" />
            <Input label="Show time" name="show_time" type="time" />
          </div>
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          name="description"
          placeholder="What's this series about? (optional)"
          maxLength={500}
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-2">
            {errors.form}
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
          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isPending}
          >
            {isOneOff ? 'Create show' : 'Create series'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
