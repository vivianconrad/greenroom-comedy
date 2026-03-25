'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, fillTemplate } from '@/lib/utils'
import { createCommTemplate, updateCommTemplate, deleteCommTemplate } from '@/lib/actions/comms'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

// ─── Sample show data for template preview ────────────────────────────────────

const PREVIEW_SHOW = {
  date: '2026-04-05',
  call_time: '18:00:00',
  doors_time: '19:00:00',
  show_time: '19:30:00',
  venue: 'The Comedy Store',
  theme: 'Spooky Season',
  ticket_url: 'https://tickets.example.com',
  promo_code: 'GREENROOM20',
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

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag, active, onClick, onRemove }) {
  if (onRemove) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lav-bg text-lav text-xs font-body font-medium border border-lav/20">
        {tag}
        <button
          type="button"
          onClick={onRemove}
          className="leading-none hover:text-deep transition-colors"
          aria-label={`Remove tag ${tag}`}
        >
          ×
        </button>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-body font-medium transition-colors',
        active
          ? 'bg-lav text-white'
          : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
      )}
    >
      {tag}
    </button>
  )
}

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState('')

  function addFromInput() {
    const newTags = input.split(',').map(t => t.trim()).filter(t => t && !tags.includes(t))
    if (newTags.length) onChange([...tags, ...newTags])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addFromInput()
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-soft font-body">Tags <span className="font-normal text-soft/70">(optional)</span></label>
      <div className="flex flex-wrap items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg border border-peach bg-white focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/60">
        {tags.map((tag) => (
          <TagPill
            key={tag}
            tag={tag}
            onRemove={() => onChange(tags.filter(t => t !== tag))}
          />
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addFromInput}
          placeholder={tags.length ? '' : 'Type a tag, press Enter or comma'}
          className="flex-1 min-w-24 text-sm font-body text-deep bg-transparent outline-none placeholder:text-soft/50"
        />
      </div>
      <p className="text-xs text-soft font-body">Link this template to checklist items or steps by using a shared tag.</p>
    </div>
  )
}

// ─── Template create / edit modal ─────────────────────────────────────────────

function CommTemplateModal({ open, onClose, seriesId, template }) {
  const router = useRouter()
  const isEdit = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [body, setBody] = useState(template?.body ?? '')
  const [tags, setTags] = useState(template?.tags ?? [])
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
        ? await updateCommTemplate(template.id, seriesId, { name, body, tags })
        : await createCommTemplate(seriesId, { name, body, tags })
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
            Variables: [name] [date] [callTime] [doors] [showTime] [venue] [theme] [runningOrder] [ticketUrl] [promoCode]
          </p>
        </div>

        <TagInput tags={tags} onChange={setTags} />

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
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-sm font-semibold text-deep font-body">{template.name}</h3>
          {template.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
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
  const [activeTag, setActiveTag] = useState(null)

  // Collect all unique tags across templates
  const allTags = [...new Set(templates.flatMap(t => t.tags ?? []))].sort()

  const visible = activeTag
    ? templates.filter(t => t.tags?.includes(activeTag))
    : templates

  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-soft font-body">
          {templates.length > 0
            ? `${templates.length} template${templates.length !== 1 ? 's' : ''} — used across all shows in this series`
            : 'Templates are reused across every show in this series.'}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
          + New template
        </Button>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'px-2.5 py-1 rounded-full text-xs font-body font-medium transition-colors',
              !activeTag ? 'bg-lav text-white' : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <TagPill
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faEnvelope} className="h-8 w-8 text-soft/40" />}
          title="No comms templates yet"
          description="Add message templates for performer confirmations, reminders, and show-night comms."
          className="py-16"
        />
      ) : visible.length === 0 ? (
        <p className="text-sm text-soft font-body py-8 text-center">No templates tagged "{activeTag}".</p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((t) => (
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
