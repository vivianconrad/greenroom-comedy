'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { createPerformer } from '@/lib/actions/performers'

export function AddPerformerModal({ open, onClose }) {
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

    const name = formData.get('name')?.toString().trim()
    if (!name) {
      setErrors({ name: 'Name is required.' })
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await createPerformer(formData)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add performer">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Name"
              name="name"
              placeholder="e.g. Jordan Rivers"
              error={errors.name}
              autoFocus
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Pronouns"
              name="pronouns"
              placeholder="e.g. she/her"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Act type"
              name="act_type"
              placeholder="e.g. Stand-up, Drag, Improv"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Instagram"
              name="instagram"
              placeholder="@handle"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="performer@example.com"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Best way to contact"
              name="contact_method"
              placeholder="e.g. Email, Instagram DM"
            />
          </div>
        </div>

        <Input
          label="How we met"
          name="how_we_met"
          placeholder="e.g. Open mic at The Punchline"
        />

        <Textarea
          label="Notes"
          name="notes"
          placeholder="Anything useful to remember…"
          maxLength={1000}
        />

        <Input
          label="Tags"
          name="tags"
          placeholder="Comma-separated: queer, local, headliner"
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
            Add performer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
