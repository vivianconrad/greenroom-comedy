'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/show'
import {
  saveChecklistToShowOnly,
  saveChecklistToTemplate,
  saveChecklistToTemplateAndPush,
  addChecklistItem,
  updateChecklistItemOwner,
} from '@/lib/actions/checklist'
import { Modal } from '@/components/atoms/modal'
import { Button } from '@/components/atoms/button'
import { Pill } from '@/components/atoms/pill'
import { Toggle } from '@/components/atoms/toggle'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'

const STAGES = [
  { key: 'pre', label: 'Pre-show' },
  { key: 'day', label: 'Show Day' },
  { key: 'post', label: 'Post-show' },
]

const SAVE_OPTIONS = [
  {
    value: 'show_only',
    label: 'This show only',
    description: "Save changes to this show's checklist only.",
    recommended: true,
  },
  {
    value: 'update_template',
    label: 'Update series template',
    description: 'Update the template so future shows start with these tasks.',
  },
  {
    value: 'push_upcoming',
    label: 'Template + push to upcoming',
    description: 'Update the template and sync changes to all upcoming shows in this series.',
  },
]

function getItemUrgency(item, showDate, today) {
  if (!showDate || item.weeks_out == null || item.done || item.stage !== 'pre') return null
  const deadline = new Date(showDate)
  deadline.setDate(deadline.getDate() - item.weeks_out * 7)
  const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'overdue'
  if (daysUntil <= 7) return 'due-soon'
  return null
}

export function ChecklistTab({ show }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const showDate = show.date ? new Date(show.date) : null

  const [activeCategory, setActiveCategory] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [editMode, setEditMode] = useState(false)
  // { [itemId]: boolean } — overrides for enabled in edit mode
  const [activeOverrides, setActiveOverrides] = useState({})
  // { [itemId]: boolean } — optimistic done state while server updates
  const [doneOverrides, setDoneOverrides] = useState({})
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveOption, setSaveOption] = useState('show_only')
  const [saving, setSaving] = useState(false)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', stage: 'pre', category: '', owner: '', weeksOut: '' })
  const [adding, setAdding] = useState(false)

  const [ownerEditId, setOwnerEditId] = useState(null)
  const [ownerEditValue, setOwnerEditValue] = useState('')

  // Inline comm prompt: { itemId, templateId, templateName } after checking a linked item
  const [commPrompt, setCommPrompt] = useState(null)

  const categories = [...new Set(show.checklistItems.map((i) => i.category).filter(Boolean))].sort()
  const allTags = [...new Set(show.checklistItems.flatMap((i) => i.tags ?? []))].sort()

  function getIsActive(item) {
    return activeOverrides[item.id] ?? (item.enabled !== false)
  }

  const filteredItems = show.checklistItems
    .filter((i) => !activeCategory || i.category === activeCategory)
    .filter((i) => !activeTag || (i.tags ?? []).includes(activeTag))

  function handleToggleEditMode() {
    if (!editMode) {
      setActiveOverrides({})
      setEditMode(true)
      return
    }
    // Check for changes before exiting
    const hasChanges = show.checklistItems.some(
      (item) => activeOverrides[item.id] !== undefined && activeOverrides[item.id] !== (item.enabled !== false)
    )
    if (!hasChanges) {
      setEditMode(false)
      return
    }
    setSaveOption('show_only')
    setSaveModalOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const items = show.checklistItems.map((item) => ({
      id: item.id,
      enabled: getIsActive(item),
      template_id: item.template_id ?? null,
    }))

    if (saveOption === 'show_only') {
      await saveChecklistToShowOnly(show.id, items)
    } else if (saveOption === 'update_template') {
      await saveChecklistToTemplate(show.series_id, items)
    } else {
      await saveChecklistToTemplateAndPush(show.series_id, show.id, items)
    }

    setSaveModalOpen(false)
    setEditMode(false)
    setActiveOverrides({})
    setSaving(false)
    router.refresh()
  }

  async function handleAddTask(e) {
    e.preventDefault()
    setAdding(true)
    await addChecklistItem(show.id, {
      name: addForm.name,
      category: addForm.category || null,
      stage: addForm.stage,
      default_owner: addForm.owner || null,
      weeks_out: addForm.weeksOut || null,
    })
    setAddModalOpen(false)
    setAddForm({ name: '', stage: 'pre', category: '', owner: '', weeksOut: '' })
    setAdding(false)
    router.refresh()
  }

  async function handleOwnerSave(itemId) {
    const trimmed = ownerEditValue.trim()
    setOwnerEditId(null)
    await updateChecklistItemOwner(itemId, trimmed || null)
    router.refresh()
  }

  function getIsDone(item) {
    return doneOverrides[item.id] ?? item.done
  }

  function handleToggleDone(itemId) {
    const item = show.checklistItems.find((i) => i.id === itemId)
    const newDone = !getIsDone(item)
    setDoneOverrides((prev) => ({ ...prev, [itemId]: newDone }))
    // If we're marking done and item has a linked comm, show prompt
    if (item && newDone && item.comm_template_id) {
      const tmpl = (show.commTemplates ?? []).find((t) => t.id === item.comm_template_id)
      setCommPrompt({ itemId, templateId: item.comm_template_id, templateName: tmpl?.name ?? 'comm template' })
    } else if (commPrompt?.itemId === itemId) {
      setCommPrompt(null)
    }
    startTransition(async () => {
      await toggleChecklistItem(itemId)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Top bar: category filters + actions */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <div className="flex gap-2 flex-wrap flex-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              !activeCategory ? 'bg-coral text-cream' : 'bg-peach text-mid hover:bg-peach/80'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                activeCategory === cat ? 'bg-coral text-cream' : 'bg-peach text-mid hover:bg-peach/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant={editMode ? 'primary' : 'ghost'} size="sm" onClick={handleToggleEditMode}>
            {editMode ? 'Done editing' : 'Edit mode'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAddModalOpen(true)}>
            + Add task
          </Button>
        </div>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
              !activeTag ? 'bg-lav text-white' : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
            )}
          >
            All tags
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
                activeTag === tag ? 'bg-lav text-white' : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {editMode && (
        <div className="mb-4 px-4 py-3 bg-lav-bg border border-lav/20 rounded-card text-sm text-deep">
          <strong>Edit mode:</strong> Toggle tasks on/off to customise this show's checklist. Changes
          won't be saved until you click "Done editing".
        </div>
      )}

      {/* Grouped by stage */}
      {STAGES.map((stage) => {
        const stageItems = filteredItems.filter((i) => (i.stage ?? 'pre') === stage.key)
        // In edit mode show inactive tasks (greyed); in normal mode hide them
        const visibleItems = editMode ? stageItems : stageItems.filter((i) => i.enabled !== false)
        if (visibleItems.length === 0) return null

        return (
          <div key={stage.key} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-soft mb-2 px-1">
              {stage.label}
            </h3>
            <div className="bg-white rounded-card border border-peach overflow-hidden">
              {visibleItems.map((item) => {
                const isActive = getIsActive(item)
                return (
                  <div key={item.id} className="border-b border-peach last:border-b-0">
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-opacity',
                      editMode && !isActive && 'opacity-40'
                    )}
                  >
                    {editMode ? (
                      <Toggle
                        checked={isActive}
                        onChange={(checked) =>
                          setActiveOverrides((prev) => ({ ...prev, [item.id]: checked }))
                        }
                      />
                    ) : (
                      <input
                        type="checkbox"
                        checked={getIsDone(item)}
                        onChange={() => handleToggleDone(item.id)}
                        className="accent-coral shrink-0 cursor-pointer"
                      />
                    )}

                    <span
                      className={cn(
                        'flex-1 text-sm text-deep',
                        getIsDone(item) && !editMode && 'line-through text-soft'
                      )}
                    >
                      {item.task}
                    </span>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {item.category && (
                        <Pill variant="neutral" className="text-xs">
                          {item.category}
                        </Pill>
                      )}
                      {(item.tags ?? []).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full bg-lav-bg text-lav text-xs font-body font-medium border border-lav/20 hidden sm:inline-flex">
                          {tag}
                        </span>
                      ))}
                      {!editMode && (
                        ownerEditId === item.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={ownerEditValue}
                            onChange={(e) => setOwnerEditValue(e.target.value)}
                            onBlur={() => handleOwnerSave(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleOwnerSave(item.id)
                              if (e.key === 'Escape') setOwnerEditId(null)
                            }}
                            placeholder="Add owner…"
                            className="text-xs border border-peach rounded px-1.5 py-0.5 w-24 focus:outline-none focus:border-coral bg-white"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setOwnerEditId(item.id)
                              setOwnerEditValue(item.owner ?? '')
                            }}
                            className={cn(
                              'text-xs transition-colors hidden sm:block',
                              item.owner ? 'text-soft hover:text-deep' : 'text-soft/40 hover:text-soft'
                            )}
                            title={item.owner ? 'Edit owner' : 'Add owner'}
                          >
                            {item.owner ?? '+ owner'}
                          </button>
                        )
                      )}
                      {editMode && item.owner && (
                        <span className="text-xs text-soft hidden sm:block">{item.owner}</span>
                      )}
                      {item.weeks_out != null && (() => {
                        const urgency = getItemUrgency(item, showDate, today)
                        if (urgency === 'overdue') return (
                          <span className="text-xs font-medium text-red hidden sm:block">Overdue</span>
                        )
                        if (urgency === 'due-soon') return (
                          <span className="text-xs font-medium text-coral hidden sm:block">Due now</span>
                        )
                        return <span className="text-xs text-soft hidden sm:block">{item.weeks_out}w out</span>
                      })()}
                      {item.comm_template_id && !editMode && (
                        <Link
                          href={`${pathname}?tab=comms&template=${item.comm_template_id}`}
                          title="Open linked comm template"
                          className="text-lav hover:text-lav/70 transition-colors leading-none"
                        >
                          <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Comm prompt — appears inline when item is just checked */}
                  {commPrompt?.itemId === item.id && !editMode && (
                    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-lav-bg border-t border-lav/20 text-xs font-body">
                      <span className="text-lav">
                        Ready to send &ldquo;{commPrompt.templateName}&rdquo;?
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`${pathname}?tab=comms&template=${commPrompt.templateId}`}
                          className="text-lav font-medium hover:underline"
                          onClick={() => setCommPrompt(null)}
                        >
                          Open comms
                        </Link>
                        <button
                          onClick={() => setCommPrompt(null)}
                          className="text-soft hover:text-mid transition-colors"
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {show.checklistItems.length === 0 && (
        <p className="text-soft text-sm text-center py-8">
          No checklist items. Add tasks or set up a checklist template on the series.
        </p>
      )}

      {/* Save modal */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save checklist changes"
      >
        <div className="space-y-3">
          {SAVE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex gap-3 p-3 rounded-card border cursor-pointer transition-colors',
                saveOption === option.value
                  ? 'border-coral bg-coral/5'
                  : 'border-peach hover:bg-cream'
              )}
            >
              <input
                type="radio"
                name="saveOption"
                value={option.value}
                checked={saveOption === option.value}
                onChange={() => setSaveOption(option.value)}
                className="mt-0.5 accent-coral shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-deep">{option.label}</span>
                  {option.recommended && (
                    <Pill variant="info" className="text-xs">
                      Recommended
                    </Pill>
                  )}
                </div>
                <p className="text-xs text-soft mt-0.5">{option.description}</p>
              </div>
            </label>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add task modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add task">
        <form onSubmit={handleAddTask} className="space-y-4">
          <Input
            label="Task name"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            required
            autoFocus
          />
          <Select
            label="Stage"
            value={addForm.stage}
            onChange={(e) => setAddForm((f) => ({ ...f, stage: e.target.value }))}
          >
            <option value="pre">Pre-show</option>
            <option value="day">Show Day</option>
            <option value="post">Post-show</option>
          </Select>
          <Input
            label="Category"
            value={addForm.category}
            onChange={(e) => setAddForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="e.g. Promo, Tech, Admin"
          />
          <Input
            label="Owner"
            value={addForm.owner}
            onChange={(e) => setAddForm((f) => ({ ...f, owner: e.target.value }))}
            placeholder="e.g. Producer, MC"
          />
          <Input
            label="Weeks out"
            type="number"
            value={addForm.weeksOut}
            onChange={(e) => setAddForm((f) => ({ ...f, weeksOut: e.target.value }))}
            placeholder="e.g. 2"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={adding}>
              Add task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
