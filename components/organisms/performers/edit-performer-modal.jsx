'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/atoms/modal'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Button } from '@/components/atoms/button'
import { fetchPerformerForEdit, updatePerformer } from '@/lib/actions/performers'

export function EditPerformerModal({ performerId, open, onClose }) {
  const router = useRouter()
  const [performer, setPerformer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  // Fetch full performer data when modal opens
  useEffect(() => {
    if (!open || !performerId) return
    setLoading(true)
    setErrors({})
    fetchPerformerForEdit(performerId).then(({ performer: p, error }) => {
      setLoading(false)
      if (error || !p) { setErrors({ form: error ?? 'Could not load performer.' }); return }
      setPerformer(p)
    })
  }, [open, performerId])

  function handleClose() {
    if (isPending) return
    setPerformer(null)
    setErrors({})
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name')?.toString().trim()
    if (!name) { setErrors({ name: 'Name is required.' }); return }
    setErrors({})

    startTransition(async () => {
      const result = await updatePerformer(performerId, formData)
      if (result?.error) { setErrors({ form: result.error }); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Edit performer">
      {loading ? (
        <p className="py-8 text-center text-soft text-sm font-body">Loading…</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Name"
                name="name"
                defaultValue={performer?.name ?? ''}
                placeholder="e.g. Jordan Rivers"
                error={errors.name}
                autoFocus
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Stage name"
                name="stage_name"
                defaultValue={performer?.stage_name ?? ''}
                placeholder="If different from legal name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Pronouns"
                name="pronouns"
                defaultValue={performer?.pronouns ?? ''}
                placeholder="e.g. she/her"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Act type"
                name="act_type"
                defaultValue={performer?.act_type ?? ''}
                placeholder="e.g. Stand-up, Drag, Improv"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Instagram"
                name="instagram"
                defaultValue={performer?.instagram ?? ''}
                placeholder="@handle"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={performer?.email ?? ''}
                placeholder="performer@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Best way to contact"
                name="contact_method"
                defaultValue={performer?.contact_method ?? ''}
                placeholder="e.g. Email, Instagram DM"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="How we met"
                name="how_we_met"
                defaultValue={performer?.how_we_met ?? ''}
                placeholder="e.g. Open mic at The Punchline"
              />
            </div>
          </div>

          <Input
            label="Clip"
            name="clip_url"
            type="url"
            defaultValue={performer?.clip_url ?? ''}
            placeholder="https://…"
          />

          <Textarea
            label="Notes"
            name="notes"
            defaultValue={performer?.notes ?? ''}
            placeholder="Anything useful to remember…"
            maxLength={1000}
          />

          <Input
            label="Tags"
            name="tags"
            defaultValue={performer?.tags?.join(', ') ?? ''}
            placeholder="Comma-separated: queer, local, headliner"
          />

          {errors.form && (
            <p role="alert" className="text-sm text-red font-body -mt-1">
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
      )}
    </Modal>
  )
}
