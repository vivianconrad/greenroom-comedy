'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  createDuty,
  updateDuty,
  deleteDuty,
  toggleDutyCompleted,
  reorderDuties,
} from '@/lib/actions/duties'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Add / Edit duty modal ────────────────────────────────────────────────────

function DutyModal({ showId, nameOptions, duty, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  const isEdit = Boolean(duty)
  const listId = `duty-names-${showId}`

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
        ? await updateDuty(duty.id, data)
        : await createDuty(showId, data)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <>
      {/* Datalist for autocomplete */}
      <datalist id={listId}>
        {nameOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <Modal
        open={open}
        onClose={handleClose}
        title={isEdit ? 'Edit duty' : 'Add duty'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Assigned to"
            name="assigned_to"
            placeholder="e.g. Vi, Emma, Maddie"
            defaultValue={duty?.assigned_to ?? ''}
            autoComplete="off"
            list={listId}
            autoFocus={!isEdit}
          />
          <Input
            label="Duty"
            name="duty"
            placeholder="e.g. Gather audience judges during game"
            defaultValue={duty?.duty ?? ''}
            required
            autoFocus={isEdit}
          />
          <Input
            label="Time note"
            name="time_note"
            placeholder="e.g. During audience game, Before show"
            defaultValue={duty?.time_note ?? ''}
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
    </>
  )
}

// ─── Reassign modal ───────────────────────────────────────────────────────────

function ReassignModal({ showId, duty, nameOptions, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()
  const listId = `reassign-names-${showId}`

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
      const result = await updateDuty(duty.id, {
        assigned_to: fd.get('assigned_to') || null,
      })
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <>
      <datalist id={listId}>
        {nameOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <Modal open={open} onClose={handleClose} title="Reassign duty">
        <p className="text-sm text-soft font-body mb-4">{duty?.duty}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Assign to"
            name="assigned_to"
            placeholder="Name, or leave blank for Unassigned"
            defaultValue={duty?.assigned_to ?? ''}
            autoComplete="off"
            list={listId}
            autoFocus
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
              Reassign
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}

// ─── Duty row ─────────────────────────────────────────────────────────────────

function DutyRow({ duty, showId, nameOptions, onDragStart, onDragOver, onDrop, isDraggingOver }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [reassignOpen, setReassignOpen] = useState(false)

  function handleToggle() {
    startTransition(async () => {
      await toggleDutyCompleted(duty.id)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteDuty(duty.id)
      router.refresh()
    })
  }

  return (
    <>
      <li
        draggable
        onDragStart={() => onDragStart(duty.id)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(duty.id) }}
        onDrop={() => onDrop(duty.id)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 group hover:bg-cream/50 transition-colors cursor-grab active:cursor-grabbing',
          isDraggingOver && 'border-t-2 border-coral'
        )}
      >
        {/* Drag handle */}
        <span className="text-soft/30 select-none text-lg shrink-0" aria-hidden>⠿</span>

        {/* Checkbox */}
        <button
          type="button"
          onClick={handleToggle}
          className={cn(
            'w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all',
            duty.completed
              ? 'bg-sage border-sage'
              : 'border-mid/50 hover:border-mid'
          )}
          aria-label={duty.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {duty.completed && <span className="text-white text-xs font-bold leading-none">✓</span>}
        </button>

        {/* Duty text + time note */}
        <div className="flex-1 min-w-0">
          <span className={cn(
            'text-sm font-body text-deep',
            duty.completed && 'line-through text-soft'
          )}>
            {duty.duty}
          </span>
          {duty.time_note && (
            <span className="ml-2 text-xs text-soft font-body">{duty.time_note}</span>
          )}
        </div>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => setReassignOpen(true)}
            className="text-xs text-soft hover:text-mid font-body px-1.5 py-0.5 rounded hover:bg-peach transition-colors"
          >
            Reassign
          </button>
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

      <DutyModal
        showId={showId}
        nameOptions={nameOptions}
        duty={duty}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
      <ReassignModal
        showId={showId}
        duty={duty}
        nameOptions={nameOptions}
        open={reassignOpen}
        onClose={() => setReassignOpen(false)}
      />
    </>
  )
}

// ─── Person group ─────────────────────────────────────────────────────────────

function PersonGroup({ group, showId, nameOptions, onDragStart, dragOverId, onDragOver, onDrop }) {
  return (
    <div className="rounded-card border border-peach bg-white overflow-hidden">
      <div className="px-4 py-2 bg-cream/60 border-b border-peach">
        <span className="text-sm font-semibold font-body text-deep">{group.assignedTo}</span>
        <span className="ml-2 text-xs text-soft font-body">
          {group.duties.filter((d) => d.completed).length}/{group.duties.length} done
        </span>
      </div>
      <ul className="divide-y divide-peach">
        {group.duties.map((duty) => (
          <DutyRow
            key={duty.id}
            duty={duty}
            showId={showId}
            nameOptions={nameOptions}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={(targetId) => onDrop(group.assignedTo, targetId)}
            isDraggingOver={dragOverId === duty.id}
          />
        ))}
      </ul>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function DutiesTab({ show, duties: initialDuties }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [addOpen, setAddOpen] = useState(false)
  const [localDuties, setLocalDuties] = useState(initialDuties)
  const dragId = useRef(null)
  const [dragOverId, setDragOverId] = useState(null)

  // Autocomplete names: performers on this show + any existing assigned_to names
  const nameOptions = [
    ...new Set([
      ...(show.performers ?? []).map((p) => p.name).filter(Boolean),
      ...initialDuties.flatMap((g) => (g.assignedTo !== 'Unassigned' ? [g.assignedTo] : [])),
    ]),
  ].sort()

  function handleDragStart(id) {
    dragId.current = id
  }

  function handleDragOver(id) {
    setDragOverId(id)
  }

  function handleDrop(groupKey, targetId) {
    const fromId = dragId.current
    dragId.current = null
    setDragOverId(null)
    if (!fromId || fromId === targetId) return

    setLocalDuties((prev) => {
      const next = prev.map((group) => {
        if (group.assignedTo !== groupKey) return group
        const list = [...group.duties]
        const fromIdx = list.findIndex((d) => d.id === fromId)
        const toIdx = list.findIndex((d) => d.id === targetId)
        if (fromIdx === -1 || toIdx === -1) return group
        const [moved] = list.splice(fromIdx, 1)
        list.splice(toIdx, 0, moved)
        // Persist new order
        startTransition(async () => {
          await reorderDuties(
            show.id,
            list.map((d, i) => ({ id: d.id, sort_order: i }))
          )
          router.refresh()
        })
        return { ...group, duties: list }
      })
      return next
    })
  }

  const totalDone = localDuties.reduce((sum, g) => sum + g.duties.filter((d) => d.completed).length, 0)
  const totalCount = localDuties.reduce((sum, g) => sum + g.duties.length, 0)

  return (
    <div className="pt-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-deep">Day-of Duties</h2>
          <p className="text-sm text-soft font-body mt-0.5">Who's doing what during the show</p>
        </div>
        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <span className="text-sm text-soft font-body">
              {totalDone}/{totalCount} done
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
            + Add duty
          </Button>
        </div>
      </div>

      {localDuties.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No duties yet"
          description="Add day-of duties and assign them to people to keep the show running smoothly."
          action={
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              + Add duty
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {localDuties.map((group) => (
            <PersonGroup
              key={group.assignedTo}
              group={group}
              showId={show.id}
              nameOptions={nameOptions}
              onDragStart={handleDragStart}
              dragOverId={dragOverId}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      <DutyModal
        showId={show.id}
        nameOptions={nameOptions}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  )
}
