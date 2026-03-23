'use client'

import { useState, useTransition } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createShow } from '@/lib/actions/series'

/**
 * Modal for adding a show to an existing series.
 *
 * @param {string}  seriesId   — ID of the parent series
 * @param {object}  defaults   — { venue, call_time, doors_time, show_time }
 *                               Pre-filled from the series record
 * @param {boolean} open
 * @param {()=>void} onClose
 */
export function CreateShowModal({ seriesId, defaults = {}, open, onClose }) {
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

    if (!formData.get('date')?.toString()) {
      setErrors({ date: 'Show date is required.' })
      return
    }
    setErrors({})

    startTransition(async () => {
      // createShow calls redirect() on success
      const result = await createShow(seriesId, formData)
      if (result?.error) setErrors({ form: result.error })
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add show">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Date — required */}
        <Input
          label="Show date"
          name="date"
          type="date"
          error={errors.date}
          autoFocus
          required
        />

        {/* Times — pre-filled from series defaults */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-soft font-body">Times</span>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Call time"
              name="call_time"
              type="time"
              defaultValue={defaults.call_time ?? ''}
            />
            <Input
              label="Doors"
              name="doors_time"
              type="time"
              defaultValue={defaults.doors_time ?? ''}
            />
            <Input
              label="Show time"
              name="show_time"
              type="time"
              defaultValue={defaults.show_time ?? ''}
            />
          </div>
        </div>

        {/* Venue — pre-filled from series default */}
        <Input
          label="Venue"
          name="venue"
          placeholder="e.g. The Comedy Store"
          defaultValue={defaults.venue ?? ''}
        />

        {/* Theme — optional */}
        <Input
          label="Theme"
          name="theme"
          placeholder="Optional — e.g. Best of 2025"
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-1">
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
            Create show
          </Button>
        </div>
      </form>
    </Modal>
  )
}
