'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/ui/toggle'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { EmptyState } from '@/components/ui/empty-state'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope, faCircleCheck } from '@fortawesome/free-solid-svg-icons'
import {
  createChecklistTemplate,
  updateChecklistTemplateActive,
  updateChecklistTemplateLink,
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

function AddTaskModal({ seriesId, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createChecklistTemplate(seriesId, {
        name: fd.get('name'),
        category: fd.get('category') || null,
        condition: fd.get('condition') || null,
        default_owner: fd.get('default_owner') || null,
        weeks_out: fd.get('weeks_out') ? parseInt(fd.get('weeks_out'), 10) : null,
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
            label="Weeks out"
            name="weeks_out"
            type="number"
            min="0"
            max="52"
            placeholder="e.g. 2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Condition (optional)" name="condition" placeholder="e.g. if: superlatives" />
          <Input label="Default owner (optional)" name="default_owner" placeholder="e.g. MC" />
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

function CommLinkSelect({ task, commTemplates }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const linked = commTemplates.find(t => t.id === task.comm_template_id)

  function handleChange(e) {
    const newId = e.target.value || null
    startTransition(async () => {
      await updateChecklistTemplateLink(task.id, newId)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <FontAwesomeIcon icon={faEnvelope} className="h-3 w-3 text-soft/50" />
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
        {commTemplates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, commTemplates }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggle(checked) {
    startTransition(async () => {
      await updateChecklistTemplateActive(task.id, checked)
      router.refresh()
    })
  }

  return (
    <li className={cn(
      'flex items-center gap-3 py-3 px-4 group hover:bg-cream/50 transition-colors',
      !task.enabled && 'opacity-50'
    )}>
      <Toggle
        checked={task.enabled}
        onChange={handleToggle}
        disabled={isPending}
        aria-label={task.enabled ? 'Deactivate task' : 'Activate task'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'text-sm font-body text-deep',
            !task.enabled && 'line-through text-soft'
          )}>
            {task.task}
          </span>

          {task.condition && (
            <Pill variant="neutral" className="text-xs bg-lav-bg text-lav border-0">
              if: {task.condition}
            </Pill>
          )}

          {task.category && (
            <Pill variant="neutral">{task.category}</Pill>
          )}
        </div>

        <div className="flex items-center gap-3 mt-0.5 text-xs font-body text-soft">
          {task.default_owner && (
            <span>Owner: <span className="text-mid">{task.default_owner}</span></span>
          )}
          {task.weeks_out != null && (
            <span>{task.weeks_out}w out</span>
          )}
        </div>
      </div>

      {commTemplates.length > 0 && (
        <CommLinkSelect task={task} commTemplates={commTemplates} />
      )}
    </li>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ChecklistTemplateTab({ tasks, seriesId, commTemplates = [] }) {
  const [addTaskOpen, setAddTaskOpen] = useState(false)

  return (
    <div className="pt-6 flex flex-col gap-4">
      {/* Info banner */}
      <div className="rounded-lg bg-butter/60 border border-butter px-4 py-3 text-sm font-body text-mid">
        <span className="font-semibold">Default checklist: </span>
        These tasks are added automatically to every new show in this series. Toggle off any tasks you don't always need.
        {commTemplates.length > 0 && (
          <span> Link a comm template to a task to get a quick-send shortcut on every show's checklist.</span>
        )}
      </div>

      {/* Top action bar */}
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAddTaskOpen(true)}>
          + Add Task
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
          <ul className="divide-y divide-peach">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} commTemplates={commTemplates} />
            ))}
          </ul>
        </div>
      )}

      <AddTaskModal
        seriesId={seriesId}
        open={addTaskOpen}
        onClose={() => setAddTaskOpen(false)}
      />
    </div>
  )
}
