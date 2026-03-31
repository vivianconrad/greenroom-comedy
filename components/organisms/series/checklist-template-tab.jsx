'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { InfoBanner } from '@/components/atoms/info-banner'
import { Modal } from '@/components/atoms/modal'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Button } from '@/components/atoms/button'
import { Pill } from '@/components/atoms/pill'
import { EmptyState } from '@/components/atoms/empty-state'
import { InfoTooltip } from '@/components/atoms/tooltip'
import { PersonSelect } from '@/components/molecules/person-select'
import { InlinePersonInput } from '@/components/molecules/inline-person-input'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import {
  createChecklistTemplate,
  updateChecklistTemplateActive,
  updateChecklistTemplateLink,
  updateChecklistTemplateOwner,
} from '@/lib/actions/checklist-templates'

// ─── Add task modal ───────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: '', label: 'No category' },
  { value: 'booking', label: 'Booking' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'production', label: 'Production' },
  { value: 'admin', label: 'Admin' },
]

function AddTaskModal({ seriesId, open, onClose, contacts = [] }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setError(null)
    setTags([])
    setTagInput('')
    onClose()
  }

  function addTagsFromInput() {
    const newTags = tagInput.split(',').map((t) => t.trim()).filter((t) => t && !tags.includes(t))
    if (newTags.length) setTags((prev) => [...prev, ...newTags])
    setTagInput('')
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTagsFromInput()
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const finalTags = tagInput.trim()
      ? [...tags, ...tagInput.split(',').map((t) => t.trim()).filter(Boolean)]
      : tags
    setError(null)
    startTransition(async () => {
      const result = await createChecklistTemplate(seriesId, {
        name: fd.get('name'),
        category: fd.get('category') || null,
        condition: fd.get('condition') || null,
        default_owner: fd.get('default_owner') || null,
        weeks_out: fd.get('weeks_out') ? parseInt(fd.get('weeks_out'), 10) : null,
        tags: finalTags,
      })
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add checklist task">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Task name" name="name" placeholder="e.g. Confirm headliner" required autoFocus />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" name="category">
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
          <Input
            label={
              <span className="inline-flex items-center gap-1">
                Weeks out
                <InfoTooltip content="How many weeks before the show date this task should ideally be done." />
              </span>
            }
            name="weeks_out"
            type="number"
            min="0"
            max="52"
            placeholder="e.g. 2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={
              <span className="inline-flex items-center gap-1">
                Condition
                <InfoTooltip content="Only add this task to shows that match a condition. e.g. 'superlatives'." />
              </span>
            }
            name="condition"
            placeholder="e.g. superlatives"
          />
          <PersonSelect label="Default owner" name="default_owner" placeholder="e.g. MC" contacts={contacts} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-soft font-body">
            Tags <span className="font-normal text-soft/70">(optional)</span>
          </label>
          <div className="flex flex-wrap items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg border border-peach bg-white focus-within:ring-2 focus-within:ring-coral/30 focus-within:border-coral/60">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lav-bg text-lav text-xs font-body font-medium border border-lav/20">
                {tag}
                <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))} className="leading-none hover:text-deep transition-colors" aria-label={`Remove ${tag}`}>×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTagsFromInput}
              placeholder={tags.length ? '' : 'Type a tag, press Enter or comma'}
              className="flex-1 min-w-24 text-sm font-body text-deep bg-transparent outline-none placeholder:text-soft/50"
            />
          </div>
        </div>

        {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>Add task</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Comm link select ─────────────────────────────────────────────────────────

function CommLinkSelect({ task, commTemplates, onUpdate }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e) {
    const newId = e.target.value || null
    startTransition(async () => {
      await updateChecklistTemplateLink(task.id, newId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-soft/50 shrink-0" />
      <select
        value={task.comm_template_id ?? ''}
        onChange={handleChange}
        disabled={isPending}
        className={cn(
          'text-xs font-body rounded border px-2 py-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-lav/50',
          task.comm_template_id
            ? 'border-lav/30 bg-lav-bg text-lav'
            : 'border-peach bg-cream text-soft hover:border-soft'
        )}
      >
        <option value="">Link comm…</option>
        {commTemplates.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <InfoTooltip content="Link a comm template to add a quick-send shortcut on every show's checklist." side="left" />
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

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, commTemplates, contacts }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(task.enabled !== false)

  function handleToggle() {
    const newEnabled = !enabled
    setEnabled(newEnabled)
    startTransition(async () => {
      await updateChecklistTemplateActive(task.id, newEnabled)
    })
  }

  function handleOwnerSave(owner) {
    startTransition(async () => {
      await updateChecklistTemplateOwner(task.id, owner)
      router.refresh()
    })
  }

  return (
    <tr className={cn(
      'border-b border-peach last:border-0 hover:bg-cream/50 transition-colors',
      !enabled && 'opacity-50'
    )}>
      {/* Enable/disable */}
      <td className="px-4 py-3 w-8">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleToggle}
          aria-label={enabled ? 'Deactivate task' : 'Activate task'}
          className="h-4 w-4 rounded border-peach text-coral accent-coral cursor-pointer"
        />
      </td>

      {/* Task name + tags */}
      <td className="px-4 py-3">
        <span className={cn('text-sm font-body text-deep', !enabled && 'line-through text-soft')}>
          {task.task}
        </span>
        {((task.tags ?? []).length > 0 || task.condition) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {task.condition && (
              <Pill variant="neutral" className="text-xs bg-lav-bg text-lav border-0">
                if: {task.condition}
              </Pill>
            )}
            {(task.tags ?? []).map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full bg-lav-bg text-lav text-xs font-body font-medium border border-lav/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </td>

      {/* Category */}
      <td className="px-4 py-3 w-28">
        {task.category && <Pill variant="neutral">{task.category}</Pill>}
      </td>

      {/* Timing */}
      <td className="px-4 py-3 w-24 text-xs font-body text-soft whitespace-nowrap">
        {task.weeks_out != null ? `${task.weeks_out}w out` : '—'}
      </td>

      {/* Owner */}
      <td className="px-4 py-3 w-32">
        <InlinePersonInput
          value={task.default_owner}
          onSave={handleOwnerSave}
          contacts={contacts}
        />
      </td>

      {/* Comm link */}
      {commTemplates.length > 0 && (
        <td className="px-4 py-3 w-36">
          <CommLinkSelect task={task} commTemplates={commTemplates} />
        </td>
      )}
    </tr>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ChecklistTemplateTab({ tasks, seriesId, commTemplates = [], contacts = [] }) {
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  return (
    <div className="pt-6 flex flex-col gap-4">
      <InfoBanner>
        <span className="font-semibold">Default checklist: </span>
        These tasks are added automatically to every new show in this series. Uncheck any tasks you don't always need.
        {commTemplates.length > 0 && (
          <span> Link a comm template to a task to get a quick-send shortcut on every show's checklist.</span>
        )}
      </InfoBanner>

      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAddTaskOpen(true)}>
          + Add task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<FontAwesomeIcon icon={faCircleCheck} className="h-8 w-8 text-soft/40" />}
          title="No tasks yet"
          description="Add tasks to build your default show checklist."
          className="py-16"
        />
      ) : (
        <div className="rounded-card border border-peach bg-white overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-peach bg-cream/50">
              <tr>
                <Th className="w-8" />
                <Th>Task</Th>
                <Th className="w-28">Category</Th>
                <Th className="w-24">Timing</Th>
                <Th className="w-28">Owner</Th>
                {commTemplates.length > 0 && <Th className="w-36">Comm</Th>}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} commTemplates={commTemplates} contacts={contacts} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddTaskModal
        seriesId={seriesId}
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
        contacts={contacts}
      />
    </div>
  )
}
