'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/show'
import {
  saveChecklistToShowOnly,
  saveChecklistToTemplate,
  saveChecklistToTemplateAndPush,
  addChecklistItem,
} from '@/lib/actions/checklist'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { Toggle } from '@/components/ui/toggle'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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

export function ChecklistTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [activeCategory, setActiveCategory] = useState(null)
  const [editMode, setEditMode] = useState(false)
  // { [itemId]: boolean } — overrides for is_active in edit mode
  const [activeOverrides, setActiveOverrides] = useState({})
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [saveOption, setSaveOption] = useState('show_only')
  const [saving, setSaving] = useState(false)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', stage: 'pre', category: '', owner: '', weeksOut: '' })
  const [adding, setAdding] = useState(false)

  const categories = [...new Set(show.checklistItems.map((i) => i.category).filter(Boolean))].sort()

  function getIsActive(item) {
    return activeOverrides[item.id] ?? (item.is_active !== false)
  }

  const filteredItems = activeCategory
    ? show.checklistItems.filter((i) => i.category === activeCategory)
    : show.checklistItems

  function handleToggleEditMode() {
    if (!editMode) {
      setActiveOverrides({})
      setEditMode(true)
      return
    }
    // Check for changes before exiting
    const hasChanges = show.checklistItems.some(
      (item) => activeOverrides[item.id] !== undefined && activeOverrides[item.id] !== (item.is_active !== false)
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
      is_active: getIsActive(item),
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

  function handleToggleDone(itemId) {
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
        const visibleItems = editMode ? stageItems : stageItems.filter((i) => i.is_active !== false)
        if (visibleItems.length === 0) return null

        return (
          <div key={stage.key} className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-soft mb-2 px-1">
              {stage.label}
            </h3>
            <div className="bg-white rounded-card border border-peach divide-y divide-peach">
              {visibleItems.map((item) => {
                const isActive = getIsActive(item)
                return (
                  <div
                    key={item.id}
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
                        checked={item.done}
                        onChange={() => handleToggleDone(item.id)}
                        className="accent-coral shrink-0 cursor-pointer"
                      />
                    )}

                    <span
                      className={cn(
                        'flex-1 text-sm text-deep',
                        item.done && !editMode && 'line-through text-soft'
                      )}
                    >
                      {item.name}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.category && (
                        <Pill variant="neutral" className="text-xs">
                          {item.category}
                        </Pill>
                      )}
                      {item.default_owner && (
                        <span className="text-xs text-soft hidden sm:block">{item.default_owner}</span>
                      )}
                      {item.weeks_out != null && (
                        <span className="text-xs text-soft hidden sm:block">{item.weeks_out}w</span>
                      )}
                    </div>
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
