'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  createDutyTemplate,
  updateDutyTemplate,
  deleteDutyTemplate,
} from '@/lib/actions/duties'

// ─── Add / Edit template modal ────────────────────────────────────────────────

function DutyTemplateModal({ seriesId, template, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  const isEdit = Boolean(template)

  function handleClose() {
    if (isPending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const data = {
      assigned_to: fd.get('assigned_to') || null,
      duty: fd.get('duty'),
      time_note: fd.get('time_note') || null,
    }

    if (!data.duty?.trim()) {
      setError('Duty description is required.')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = isEdit
        ? await updateDutyTemplate(template.id, data)
        : await createDutyTemplate(seriesId, data)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit duty template' : 'Add duty template'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Assigned to"
          name="assigned_to"
          placeholder="e.g. Vi, Emma, Maddie"
          defaultValue={template?.default_assigned_to ?? ''}
          autoFocus
        />
        <Input
          label="Duty"
          name="duty"
          placeholder="e.g. Run Instagram stories throughout show"
          defaultValue={template?.duty ?? ''}
          required
        />
        <Input
          label="Time note"
          name="time_note"
          placeholder="e.g. Entire show, Before show"
          defaultValue={template?.time_note ?? ''}
        />

        {error && (
          <p role="alert" className="text-sm text-red font-body">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            {isEdit ? 'Save' : 'Add duty'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Template row ──────────────────────────────────────────────────────────────

function TemplateRow({ template }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      await deleteDutyTemplate(template.id)
      router.refresh()
    })
  }

  return (
    <>
      <li className="flex items-center gap-3 py-3 px-4 group hover:bg-cream/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {template.default_assigned_to && (
              <span className="text-xs font-semibold font-body text-mid bg-peach px-1.5 py-0.5 rounded">
                {template.default_assigned_to}
              </span>
            )}
            <span className="text-sm font-body text-deep">
              {template.duty}
            </span>
          </div>
          {template.time_note && (
            <p className="text-xs text-soft font-body mt-0.5">{template.time_note}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="text-xs text-soft hover:text-mid font-body px-1.5 py-0.5 rounded hover:bg-peach transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-soft hover:text-red font-body px-1.5 py-0.5 rounded hover:bg-peach transition-colors"
          >
            Delete
          </button>
        </div>
      </li>

      <DutyTemplateModal
        seriesId={template.series_id}
        template={template}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DutyTemplatesTab({ templates, seriesId }) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="pt-6 flex flex-col gap-4">
      {/* Info banner */}
      <div className="rounded-lg bg-butter/60 border border-butter px-4 py-3 text-sm font-body text-mid">
        <span className="font-semibold">Default duties: </span>
        These are copied to every new show in this series. Toggle off any duties that don't apply to every show.
      </div>

      {/* Top action bar */}
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
          + Add duty template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No duty templates yet"
          description="Add default duties to auto-populate new shows with day-of assignments."
          className="py-16"
        />
      ) : (
        <div className="rounded-card border border-peach bg-white overflow-hidden">
          <ul className="divide-y divide-peach">
            {templates.map((t) => (
              <TemplateRow key={t.id} template={{ ...t, series_id: seriesId }} />
            ))}
          </ul>
        </div>
      )}

      <DutyTemplateModal
        seriesId={seriesId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  )
}
