'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, fillTemplate } from '@/lib/utils'
import { createCommTemplate, updateCommTemplate, deleteCommTemplate } from '@/lib/actions/comms'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Sample show data for template preview ────────────────────────────────────

const PREVIEW_SHOW = {
  date: '2026-04-05',
  call_time: '18:00:00',
  doors_time: '19:00:00',
  show_time: '19:30:00',
  venue: 'The Comedy Store',
  performers: [
    { name: 'Jane Smith', set_length: 5 },
    { name: 'Mark Lee', set_length: 8 },
    { name: 'Sarah Chen', set_length: 10 },
  ],
}

// ─── Variable highlight renderer ─────────────────────────────────────────────

function HighlightedBody({ body }) {
  if (!body) return null
  const parts = body.split(/(\[[^\]]+\])/)
  return (
    <p className="text-sm font-body text-mid whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\[.+\]$/.test(part) ? (
          <mark key={i} className="bg-lav-bg text-lav rounded px-0.5 font-medium not-italic">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

// ─── Template create / edit modal ─────────────────────────────────────────────

function CommTemplateModal({ open, onClose, seriesId, template }) {
  const router = useRouter()
  const isEdit = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [error, setError] = useState(null)
  const [saving, startSave] = useTransition()

  function handleClose() {
    if (saving) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Template name is required.'); return }
    setError(null)
    startSave(async () => {
      const result = isEdit
        ? await updateCommTemplate(template.id, seriesId, { name, body })
        : await createCommTemplate(seriesId, { name, body })
      if (result?.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Edit template' : 'New template'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Performer Confirmation, Call Time Reminder"
          error={error && !name.trim() ? error : undefined}
          autoFocus
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-soft font-body">Message body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Hi [name],\n\nJust confirming your spot for [date] at [venue].\n\nCall time: [callTime]\nDoors: [doors]\nShow time: [showTime]\n\nRunning order:\n[runningOrder]\n\nSee you there!`}
            rows={10}
            className="w-full rounded-card border border-peach bg-white px-4 py-3 text-sm font-body text-deep leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
          <p className="text-xs text-soft font-body">
            Variables: [name] [date] [callTime] [doors] [showTime] [venue] [runningOrder]
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={saving}>
            {isEdit ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function CommTemplateCard({ template, seriesId }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, startDelete] = useTransition()

  function handleDelete() {
    startDelete(async () => {
      await deleteCommTemplate(template.id, seriesId)
      router.refresh()
    })
  }

  const preview = fillTemplate(template.body ?? '', PREVIEW_SHOW)

  return (
    <div className="rounded-card border border-peach bg-white p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-deep font-body">{template.name}</h3>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setPreviewOpen((v) => !v)}
            className="text-xs text-soft hover:text-coral font-body transition-colors px-1.5 py-1 rounded hover:bg-cream"
          >
            {previewOpen ? 'Hide preview' : 'Preview'}
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="text-xs text-soft hover:text-deep font-body transition-colors px-1.5 py-1 rounded hover:bg-cream"
          >
            Edit
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red font-medium font-body px-1.5 py-1 rounded hover:bg-red/5 transition-colors"
              >
                {deleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs text-soft font-body px-1.5 py-1 rounded hover:bg-cream transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-soft hover:text-red font-body transition-colors px-1.5 py-1 rounded hover:bg-cream"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Raw body with variable highlighting */}
      {template.body ? (
        <div className="rounded-lg bg-cream/60 border border-peach/60 px-4 py-3">
          <HighlightedBody body={template.body} />
        </div>
      ) : (
        <p className="text-sm text-soft/60 font-body italic">No body yet.</p>
      )}

      {/* Preview with sample data */}
      {previewOpen && template.body && (
        <div className="rounded-lg bg-lav-bg/40 border border-lav/20 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-lav mb-2 font-body">
            Preview with sample data
          </p>
          <p className="text-sm font-body text-deep whitespace-pre-wrap leading-relaxed">
            {preview}
          </p>
        </div>
      )}

      <CommTemplateModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        seriesId={seriesId}
        template={template}
      />
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CommsTab({ templates, seriesId }) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-soft font-body">
          {templates.length > 0
            ? `${templates.length} template${templates.length !== 1 ? 's' : ''} — used across all shows in this series`
            : 'Templates are reused across every show in this series.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
          + New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No comms templates yet"
          description="Add message templates for performer confirmations, reminders, and show-night comms."
          className="py-16"
        />
      ) : (
        <div className="flex flex-col gap-4">
          {templates.map((t) => (
            <CommTemplateCard key={t.id} template={t} seriesId={seriesId} />
          ))}
        </div>
      )}

      <CommTemplateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        seriesId={seriesId}
      />
    </div>
  )
}
