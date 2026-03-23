'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { updateShow } from '@/lib/actions/show'

export function EditShowModal({ open, onClose, show }) {
  const router = useRouter()
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
    setErrors({})

    startTransition(async () => {
      const result = await updateShow(show.id, formData)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit show">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

        <Input
          label="Date"
          name="date"
          type="date"
          defaultValue={show.date ?? ''}
          required
          autoFocus
        />

        <Input
          label="Theme"
          name="theme"
          defaultValue={show.theme ?? ''}
          placeholder="e.g. Valentine's Day Special"
        />

        <Input
          label="Venue"
          name="venue"
          defaultValue={show.venue ?? ''}
          placeholder="e.g. The Comedy Store"
        />

        <Input
          label="Hosts"
          name="hosts"
          defaultValue={show.hosts ?? ''}
          placeholder="e.g. Vi, Maddie, Emma"
        />

        <div className="grid grid-cols-3 gap-3">
          <Input label="Call time" name="call_time" type="time" defaultValue={show.call_time ?? ''} />
          <Input label="Doors" name="doors_time" type="time" defaultValue={show.doors_time ?? ''} />
          <Input label="Show time" name="show_time" type="time" defaultValue={show.show_time ?? ''} />
        </div>

        <Select label="Status" name="status" defaultValue={show.status ?? 'draft'}>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </Select>

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body">
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
