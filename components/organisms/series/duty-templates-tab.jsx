'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/atoms/modal'
import { Input } from '@/components/atoms/input'
import { Button } from '@/components/atoms/button'
import { PersonSelect } from '@/components/molecules/person-select'
import { InlinePersonInput } from '@/components/molecules/inline-person-input'
import { EmptyState } from '@/components/atoms/empty-state'
import { InfoTooltip } from '@/components/atoms/tooltip'
import { InfoBanner } from '@/components/atoms/info-banner'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClipboardList, faEnvelope } from '@fortawesome/free-solid-svg-icons'
import {
  createDutyTemplate,
  updateDutyTemplate,
  deleteDutyTemplate,
  updateDutyTemplateLink,
} from '@/lib/actions/duties'

// ─── Add / Edit template modal ────────────────────────────────────────────────

function DutyTemplateModal({ seriesId, template, open, onClose, contacts = [] }) {
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
    <Modal open={open} onClose={handleClose} title={isEdit ? 'Edit duty template' : 'Add duty template'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <PersonSelect
          label="Assigned to"
          name="assigned_to"
          placeholder="e.g. Vi, Emma, Maddie"
          defaultValue={template?.default_assigned_to ?? ''}
          contacts={contacts}
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

        {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            {isEdit ? 'Save' : 'Add duty'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Comm link select ─────────────────────────────────────────────────────────

function CommLinkSelect({ template, commTemplates }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e) {
    const newId = e.target.value || null
    startTransition(async () => {
      await updateDutyTemplateLink(template.id, newId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-soft/50 shrink-0" />
      <select
        value={template.comm_template_id ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className={cn(
          'text-xs font-body rounded border px-2 py-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-lav/50',
          template.comm_template_id
            ? 'border-lav/30 bg-lav-bg text-lav'
            : 'border-peach bg-cream text-soft hover:border-soft'
        )}
      >
        <option value="">Link comm…</option>
        {commTemplates.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <InfoTooltip content="Link a comm template to add a quick-send shortcut on every show's duties tab." side="left" />
    </div>
  )
}

// ─── Table header cell ────────────────────────────────────────────────────────

function Th({ children, className }) {
  return (
    <th className={cn('px-4 py-2.5 text-left text-xs font-medium text-soft uppercase tracking-wide whitespace-nowrap', className)}>
      {children}
    </th>
  )
}

// ─── Template row ─────────────────────────────────────────────────────────────

function TemplateRow({ template, commTemplates, contacts }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  function handleAssignedToSave(assignedTo) {
    startTransition(async () => {
      await updateDutyTemplate(template.id, { assigned_to: assignedTo })
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteDutyTemplate(template.id)
      router.refresh()
    })
  }

  return (
    <>
      <tr className="border-b border-peach last:border-0 hover:bg-cream/50 transition-colors group">
        {/* Assigned to */}
        <td className="px-4 py-3 w-36">
          <InlinePersonInput
            value={template.default_assigned_to}
            onSave={handleAssignedToSave}
            contacts={contacts}
          />
        </td>

        {/* Duty */}
        <td className="px-4 py-3">
          <span className="text-sm font-body text-deep">{template.duty}</span>
        </td>

        {/* Time note */}
        <td className="px-4 py-3 w-36 text-xs font-body text-soft whitespace-nowrap">
          {template.time_note ?? '—'}
        </td>

        {/* Comm link */}
        {commTemplates.length > 0 && (
          <td className="px-4 py-3 w-40">
            <CommLinkSelect template={template} commTemplates={commTemplates} />
          </td>
        )}

        {/* Actions */}
        <td className="px-4 py-3 w-24">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              disabled={isPending}
              className="text-xs text-soft hover:text-red font-body px-1.5 py-0.5 rounded hover:bg-peach transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      <DutyTemplateModal
        seriesId={template.series_id}
        template={template}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contacts={contacts}
      />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DutyTemplatesTab({ templates, seriesId, commTemplates = [], contacts = [] }) {
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="pt-6 flex flex-col gap-4">
      <InfoBanner storageKey="duty-templates-info">
        <span className="font-semibold">Default duties: </span>
        These are copied to every new show in this series. Toggle off any duties that don't apply to every show.
        {commTemplates.length > 0 && (
          <span> Link a comm template to a duty to get a quick-send shortcut on every show's duties tab.</span>
        )}
      </InfoBanner>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
          + Add duty template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faClipboardList} className="h-8 w-8 text-soft/40" />}
          title="No duty templates yet"
          description="Add default duties to auto-populate new shows with day-of assignments."
          className="py-16"
        />
      ) : (
        <div className="rounded-card border border-peach bg-white overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-peach bg-cream/50">
              <tr>
                <Th className="w-36">Assigned to</Th>
                <Th>Duty</Th>
                <Th className="w-36">Timing</Th>
                {commTemplates.length > 0 && <Th className="w-40">Comm</Th>}
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={{ ...t, series_id: seriesId }}
                  commTemplates={commTemplates}
                  contacts={contacts}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DutyTemplateModal
        seriesId={seriesId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        contacts={contacts}
      />
    </div>
  )
}
