'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateSeries } from '@/lib/actions/series'

// ─── Radio pill group (local copy — same as CreateSeriesModal) ────────────────

function RadioGroup({ name, options, value, onChange, columns = false }) {
  return (
    <div className={cn('flex flex-wrap gap-2', columns && 'grid grid-cols-2 sm:grid-cols-3')}>
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
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
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

export function EditSeriesModal({ open, onClose, series }) {
  const router = useRouter()
  const [frequency, setFrequency] = useState(series.frequency ?? 'monthly')
  const [showType, setShowType] = useState(series.show_type ?? '')
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setErrors({})
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const name = formData.get('name')?.toString().trim()
    if (!name) {
      setErrors({ name: 'Series name is required.' })
      return
    }
    setErrors({})

    formData.set('frequency', frequency)
    formData.set('show_type', showType)

    startTransition(async () => {
      const result = await updateSeries(series.id, formData)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit series">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

        <Input
          label="Series name"
          name="name"
          defaultValue={series.name}
          error={errors.name}
          autoFocus
          required
        />

        <div className="flex flex-col gap-2">
          <FieldLabel>Frequency</FieldLabel>
          <RadioGroup
            name="frequency"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onChange={setFrequency}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel>Show type</FieldLabel>
          <RadioGroup
            name="show_type"
            options={SHOW_TYPE_OPTIONS}
            value={showType}
            onChange={setShowType}
            columns
          />
        </div>

        <Input
          label="Default venue"
          name="venue"
          defaultValue={series.venue ?? ''}
          placeholder="e.g. The Comedy Store"
        />

        <div className="flex flex-col gap-2">
          <FieldLabel>Default times</FieldLabel>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Call time" name="call_time" type="time" defaultValue={series.default_call_time ?? ''} />
            <Input label="Doors" name="doors_time" type="time" defaultValue={series.default_doors_time ?? ''} />
            <Input label="Show time" name="show_time" type="time" defaultValue={series.default_show_time ?? ''} />
          </div>
        </div>

        <Input
          label="Default hosts"
          name="default_hosts"
          defaultValue={series.default_hosts ?? ''}
          placeholder="e.g. Vi, Maddie, Emma"
        />

        <Input
          label="Tagline"
          name="tagline"
          defaultValue={series.tagline ?? ''}
          placeholder="One sentence about your show"
        />

        <Textarea
          label="Elevator pitch"
          name="description_long"
          defaultValue={series.description_long ?? ''}
          placeholder="A paragraph about your show for longer descriptions"
          maxLength={1000}
        />

        <Input
          label="Ticket link"
          name="ticket_url"
          defaultValue={series.ticket_url ?? ''}
          placeholder="https://..."
        />

        <Input
          label="Promo code"
          name="promo_code"
          defaultValue={series.promo_code ?? ''}
          placeholder="e.g. GREENROOM20"
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-2">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
