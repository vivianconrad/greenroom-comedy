'use client'

import { useState, useTransition, useId, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createSeries } from '@/lib/actions/series'
import { getSystemTemplates } from '@/lib/actions/system-templates'

// ─── Shared UI ────────────────────────────────────────────────────────────────

function RadioGroup({ name, options, value, onChange, columns = false }) {
  useId() // keep hook count stable
  return (
    <div className={cn('flex flex-wrap gap-2', columns && 'grid grid-cols-2 sm:grid-cols-3')}>
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body cursor-pointer select-none transition-colors',
            value === opt.value
              ? 'border-coral bg-coral/10 text-coral font-medium'
              : 'border-peach bg-cream text-mid hover:border-soft hover:bg-peach'
          )}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function FieldLabel({ children, required }) {
  return (
    <span className="text-sm font-medium text-soft font-body">
      {children}
      {required && <span className="text-red ml-0.5" aria-hidden>*</span>}
    </span>
  )
}

function StepProgress({ step, total }) {
  return (
    <div className="flex gap-1 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-200',
            i + 1 <= step ? 'bg-coral' : 'bg-peach'
          )}
        />
      ))}
    </div>
  )
}

// ─── Options ──────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
  { value: 'one_off', label: 'One-off' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'custom', label: 'Custom' },
]

const SHOW_TYPE_OPTIONS = [
  { value: 'variety', label: 'Variety Show' },
  { value: 'standup', label: 'Stand-up Showcase' },
  { value: 'open_mic', label: 'Open Mic' },
  { value: 'sketch', label: 'Sketch / Improv' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
]

// ─── Preset data ──────────────────────────────────────────────────────────────

// Collections
const BASE_COLLECTION_PRESETS = [
  { name: 'Themes', description: 'Possible themes for upcoming shows', icon: '🎭' },
  { name: 'Bits & Ideas', description: 'Running gag ideas or recurring bits', icon: '💡' },
  { name: 'Prize Ideas', description: 'Prizes or giveaways for the audience', icon: '🎁' },
]
const TYPE_COLLECTION_PRESETS = {
  variety: [
    { name: 'Guest Acts', description: 'Potential guest performers to invite', icon: '🌟' },
    { name: 'Segments', description: 'Recurring or one-off segment formats', icon: '📋' },
  ],
  standup: [
    { name: 'Headliners', description: 'Potential headlining acts', icon: '🎤' },
    { name: 'Openers', description: 'Potential opening acts', icon: '🎙️' },
  ],
  sketch: [
    { name: 'Games', description: 'Improv games to feature', icon: '🎮' },
    { name: 'Formats', description: 'Long-form formats to try', icon: '🎯' },
  ],
}
function getCollectionPresets(showType) {
  return [...BASE_COLLECTION_PRESETS, ...(TYPE_COLLECTION_PRESETS[showType] ?? [])]
}

// Checklist tasks
const CHECKLIST_PRESETS = [
  { task: 'Confirm venue booking', category: 'logistics', stage: 'pre', weeks_out: 6 },
  { task: 'Confirm AV & tech requirements', category: 'logistics', stage: 'pre', weeks_out: 4 },
  { task: 'Create event on social media', category: 'marketing', stage: 'pre', weeks_out: 4 },
  { task: 'Design poster / promotional flyer', category: 'marketing', stage: 'pre', weeks_out: 3 },
  { task: 'Send performer confirmations', category: 'booking', stage: 'pre', weeks_out: 1 },
  { task: 'Write running order', category: 'production', stage: 'pre', weeks_out: 0 },
  { task: 'Sound check', category: 'production', stage: 'day', weeks_out: 0 },
  { task: 'Post show photos to social media', category: 'marketing', stage: 'post', weeks_out: 0 },
  { task: 'Send thank yous to performers', category: 'admin', stage: 'post', weeks_out: 0 },
]

const CATEGORY_LABEL = {
  booking: 'Booking',
  marketing: 'Marketing',
  logistics: 'Logistics',
  production: 'Production',
  admin: 'Admin',
}

const CATEGORY_STYLE = {
  booking: 'bg-coral/10 text-coral',
  marketing: 'bg-sage/10 text-sage',
  logistics: 'bg-lavender/10 text-lavender',
  production: 'bg-peach text-mid',
  admin: 'bg-cream border border-peach text-soft',
}

function taskTimingLabel(task) {
  if (task.stage === 'day') return 'Show day'
  if (task.stage === 'post') return 'After show'
  if (!task.weeks_out) return 'Week of show'
  return `${task.weeks_out}w out`
}

// Duty templates
const DUTY_PRESETS = [
  { duty: 'Host / MC', time_note: 'Entire show' },
  { duty: 'Tech & sound', time_note: 'Entire show' },
  { duty: 'Door / front of house', time_note: 'Doors–end' },
  { duty: 'Stage manager', time_note: 'Entire show' },
  { duty: 'Photographer', time_note: 'During show' },
]

// Comms templates
const COMMS_PRESETS = [
  {
    name: 'Performer Confirmation',
    body: "Hi [name],\n\nYou're confirmed for [date] at [venue]!\n\nCall time: [callTime]\nDoors: [doors]\nShow: [showTime]\n\nLet me know if anything changes — can't wait to see you there.",
  },
  {
    name: 'Show Reminder',
    body: 'Hi [name],\n\nQuick reminder that you\'re on the bill for [date] at [venue].\n\nCall time: [callTime] · Show time: [showTime]\n\nSee you soon!',
  },
  {
    name: 'Running Order',
    body: 'Hi [name],\n\nHere\'s the running order for [date]:\n\n[runningOrder]\n\nSee you at call time ([callTime])!',
  },
  {
    name: 'Important Info',
    body: 'Important info for [date]!\n\nSHOW DETAILS\nShow time: [showTime]\nCall time: [callTime]\nTheme: [theme]\n\nHOW IT WORKS:\nThis is a talent show-themed variety show! Audience judges will give out silly superlatives throughout the night. After the headliner, we\'ll play an audience game while judges deliberate, then all performers come back on stage for our awards ceremony.\n\nTICKETS & COMPS\nYou get 1 comp ticket (groups get 3)\nEmail me your comp requests by FRIDAY NIGHT\nFor other guests: coupon code [promoCode]\n[ticketUrl]\n\nPLEASE PROMOTE THE SHOW! Tag us and share the link 💖\n\nMUSIC/TECH\nSend any music to @ at @gmail.com - he\'s our tech guy\n\nDAY-OF LOGISTICS\nYou can hang in the green room before your set (or sit in back of house if there\'s space)\nThere\'s a door next to the stage connecting green room ↔ house, please only use it when going on/off stage\nWe\'re doing a group photo at the end! Let me know if you need to leave early so we can plan accordingly\nThe stage is a little small, so please keep that in mind for choreography/movement\nWe\'ll be taking photos and videos during your set\nIf your set includes going into the audience or you want to start off stage (for a dramatic entrance), let us know here!\n\nRunning Order:\n[runningOrder]',
  },
]

// ─── Step components ──────────────────────────────────────────────────────────

function ToggleCard({ selected, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border text-sm font-body transition-colors',
        selected
          ? 'border-coral bg-coral/10 text-dark font-medium'
          : 'border-peach bg-cream text-mid hover:border-soft hover:bg-peach'
      )}
    >
      <span className={cn('w-4 h-4 rounded border shrink-0 flex items-center justify-center text-xs', selected ? 'bg-coral border-coral text-white' : 'border-soft')}>
        {selected && '✓'}
      </span>
      {children}
    </button>
  )
}

function AddButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-soft hover:text-dark font-body transition-colors w-fit mt-1"
    >
      <span className="text-base leading-none">+</span>
      <span>Add your own</span>
    </button>
  )
}

function CustomChip({ label, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-sage bg-sage/10 text-sm font-body text-dark">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 text-soft hover:text-dark transition-colors leading-none text-base"
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </div>
  )
}

// ── Collections step ──────────────────────────────────────────────────────────

function CollectionsStep({ presets, selected, onToggle, custom, onAddCustom, onRemoveCustom }) {
  const [showForm, setShowForm] = useState(false)
  const [newIcon, setNewIcon] = useState('')
  const [newName, setNewName] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    onAddCustom({ name, icon: newIcon.trim() || null, description: null })
    setNewName('')
    setNewIcon('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-soft font-body">
        Collections help you track ideas across shows — themes, acts, prizes, and more.
      </p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => onToggle(p.name)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-body transition-colors',
              selected.has(p.name)
                ? 'border-coral bg-coral/10 text-dark font-medium'
                : 'border-peach bg-cream text-mid hover:border-soft hover:bg-peach'
            )}
          >
            <span>{p.icon}</span>
            <span>{p.name}</span>
          </button>
        ))}
        {custom.map((c, i) => (
          <CustomChip key={i} label={`${c.icon ? c.icon + ' ' : ''}${c.name}`} onRemove={() => onRemoveCustom(i)} />
        ))}
      </div>
      {showForm ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="🎤"
            maxLength={4}
            className="w-14 px-2 py-2 text-sm border border-peach rounded-lg bg-cream font-body text-center focus:outline-none focus:border-soft"
          />
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            className="flex-1 px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft"
            autoFocus
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>Add</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      ) : (
        <AddButton onClick={() => setShowForm(true)} />
      )}
    </div>
  )
}

// ── Checklist step ────────────────────────────────────────────────────────────

function ChecklistStep({ presets, selected, onToggle, custom, onAddCustom, onRemoveCustom }) {
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState('')

  function handleAdd() {
    const task = newTask.trim()
    if (!task) return
    onAddCustom({ task, category: newCategory || null, stage: 'pre', weeks_out: null })
    setNewTask('')
    setNewCategory('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-soft font-body">
        These tasks will be added to every show's checklist. You can enable/disable per show later.
      </p>
      <div className="flex flex-col gap-2">
        {presets.map((p) => (
          <ToggleCard key={p.task} selected={selected.has(p.task)} onToggle={() => onToggle(p.task)}>
            <span className="flex-1 min-w-0">
              <span className="block">{p.task}</span>
              <span className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('text-xs px-1.5 py-0.5 rounded font-body', CATEGORY_STYLE[p.category])}>
                  {CATEGORY_LABEL[p.category]}
                </span>
                <span className="text-xs text-soft font-body">{taskTimingLabel(p)}</span>
              </span>
            </span>
          </ToggleCard>
        ))}
        {custom.map((c, i) => (
          <CustomChip key={i} label={c.task} onRemove={() => onRemoveCustom(i)} />
        ))}
      </div>
      {showForm ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task name"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              className="flex-1 px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft"
              autoFocus
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="px-2 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft text-mid"
            >
              <option value="">Category</option>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>Add task</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <AddButton onClick={() => setShowForm(true)} />
      )}
    </div>
  )
}

// ── Duties step ───────────────────────────────────────────────────────────────

function DutiesStep({ presets, selected, onToggle, custom, onAddCustom, onRemoveCustom }) {
  const [showForm, setShowForm] = useState(false)
  const [newDuty, setNewDuty] = useState('')
  const [newTimeNote, setNewTimeNote] = useState('')

  function handleAdd() {
    const duty = newDuty.trim()
    if (!duty) return
    onAddCustom({ duty, time_note: newTimeNote.trim() || null })
    setNewDuty('')
    setNewTimeNote('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-soft font-body">
        Duties are assigned to team members for each show. You can set names on the series page.
      </p>
      <div className="flex flex-col gap-2">
        {presets.map((p) => (
          <ToggleCard key={p.duty} selected={selected.has(p.duty)} onToggle={() => onToggle(p.duty)}>
            <span className="flex-1 min-w-0">
              <span className="block">{p.duty}</span>
              {p.time_note && (
                <span className="text-xs text-soft font-body mt-0.5 block">{p.time_note}</span>
              )}
            </span>
          </ToggleCard>
        ))}
        {custom.map((c, i) => (
          <CustomChip key={i} label={c.duty} onRemove={() => onRemoveCustom(i)} />
        ))}
      </div>
      {showForm ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newDuty}
              onChange={(e) => setNewDuty(e.target.value)}
              placeholder="Duty description"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              className="flex-1 px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft"
              autoFocus
            />
            <input
              type="text"
              value={newTimeNote}
              onChange={(e) => setNewTimeNote(e.target.value)}
              placeholder="Timing (optional)"
              className="w-36 px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>Add duty</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <AddButton onClick={() => setShowForm(true)} />
      )}
    </div>
  )
}

// ── Comms step ────────────────────────────────────────────────────────────────

function CommsStep({ presets, selected, onToggle, custom, onAddCustom, onRemoveCustom }) {
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBody, setNewBody] = useState('')

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    onAddCustom({ name, body: newBody.trim() || null })
    setNewName('')
    setNewBody('')
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-soft font-body">
        Message templates for contacting performers. Use{' '}
        <span className="font-mono text-xs bg-peach px-1 py-0.5 rounded">[name]</span>{' '}
        <span className="font-mono text-xs bg-peach px-1 py-0.5 rounded">[date]</span>{' '}
        <span className="font-mono text-xs bg-peach px-1 py-0.5 rounded">[venue]</span> and more as placeholders.
      </p>
      <div className="flex flex-col gap-2">
        {presets.map((p) => (
          <ToggleCard key={p.name} selected={selected.has(p.name)} onToggle={() => onToggle(p.name)}>
            <span className="flex-1 min-w-0">
              <span className="block">{p.name}</span>
              <span className="block text-xs text-soft font-body mt-0.5 truncate">
                {p.body.replace(/\n/g, ' ').slice(0, 72)}…
              </span>
            </span>
          </ToggleCard>
        ))}
        {custom.map((c, i) => (
          <CustomChip key={i} label={c.name} onRemove={() => onRemoveCustom(i)} />
        ))}
      </div>
      {showForm ? (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name"
            className="px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft"
            autoFocus
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder={"Hi [name],\n\nMessage body here. Use [date], [callTime], [venue]..."}
            rows={4}
            className="px-3 py-2 text-sm border border-peach rounded-lg bg-cream font-body focus:outline-none focus:border-soft resize-none"
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>Add template</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <AddButton onClick={() => setShowForm(true)} />
      )}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5
const STEP_TITLES = {
  1: 'New series',
  2: 'Collections',
  3: 'Checklist tasks',
  4: 'Duty templates',
  5: 'Comms templates',
}

export function CreateSeriesModal({ open, onClose }) {
  const formRef = useRef(null)
  const fetchedRef = useRef(false)
  const [step, setStep] = useState(1)
  const [frequency, setFrequency] = useState('monthly')
  const [showType, setShowType] = useState('')
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  // Preset data — initialized with hardcoded fallbacks, replaced by DB values on first open
  const [checklistPresets, setChecklistPresets] = useState(CHECKLIST_PRESETS)
  const [dutyPresets, setDutyPresets] = useState(DUTY_PRESETS)
  const [commsPresets, setCommsPresets] = useState(COMMS_PRESETS)
  const [collectionPresetsDB, setCollectionPresetsDB] = useState(null) // null = use hardcoded

  // Fetch system templates from DB on first open (silently falls back to hardcoded on error)
  useEffect(() => {
    if (!open || fetchedRef.current) return
    fetchedRef.current = true
    getSystemTemplates().then((data) => {
      if (data.checklist.length) setChecklistPresets(data.checklist)
      if (data.duties.length) setDutyPresets(data.duties)
      if (data.comms.length) setCommsPresets(data.comms)
      if (data.collections.length) setCollectionPresetsDB(data.collections)
    }).catch(() => {})
  }, [open])

  function getCollPresetsForType(type) {
    if (collectionPresetsDB) {
      return collectionPresetsDB.filter((p) => p.show_type === null || p.show_type === type)
    }
    return getCollectionPresets(type)
  }

  // Step 2: Collections
  const [selectedCollections, setSelectedCollections] = useState(new Set())
  const [customCollections, setCustomCollections] = useState([])

  // Step 3: Checklist
  const [selectedChecklist, setSelectedChecklist] = useState(new Set())
  const [customChecklist, setCustomChecklist] = useState([])

  // Step 4: Duties
  const [selectedDuties, setSelectedDuties] = useState(new Set())
  const [customDuties, setCustomDuties] = useState([])

  // Step 5: Comms
  const [selectedComms, setSelectedComms] = useState(new Set())
  const [customComms, setCustomComms] = useState([])

  const isOneOff = frequency === 'one_off'

  function reset() {
    setStep(1)
    setFrequency('monthly')
    setShowType('')
    setErrors({})
    setSelectedCollections(new Set())
    setCustomCollections([])
    setSelectedChecklist(new Set())
    setCustomChecklist([])
    setSelectedDuties(new Set())
    setCustomDuties([])
    setSelectedComms(new Set())
    setCustomComms([])
  }

  function handleClose() {
    if (isPending) return
    reset()
    onClose()
  }

  function validateStep1(formData) {
    const errs = {}
    if (!formData.get('name')?.toString().trim()) errs.name = 'Series name is required.'
    if (!showType) errs.show_type = 'Select a show type.'
    if (frequency === 'one_off' && !formData.get('date')?.toString()) errs.date = 'Show date is required.'
    return errs
  }

  // Called on form submit — only meaningful for step 1 (validate+advance) and step 5 (final)
  function handleFormSubmit(e) {
    e.preventDefault()
    if (step === 1) {
      const errs = validateStep1(new FormData(e.currentTarget))
      if (Object.keys(errs).length > 0) { setErrors(errs); return }
      setErrors({})
      // Set defaults for all remaining steps (use DB presets if loaded, else hardcoded)
      setSelectedCollections(new Set(getCollPresetsForType(showType).map((p) => p.name)))
      setSelectedChecklist(new Set(checklistPresets.map((p) => p.task)))
      setSelectedDuties(new Set(dutyPresets.map((p) => p.duty)))
      setSelectedComms(new Set(commsPresets.slice(0, 1).map((p) => p.name)))
      setStep(2)
    } else if (step === TOTAL_STEPS) {
      doSubmit()
    }
  }

  function doSubmit({ skipComms = false } = {}) {
    const formData = new FormData(formRef.current)
    formData.set('frequency', frequency)
    formData.set('show_type', showType)

    formData.set('collections', JSON.stringify([
      ...getCollPresetsForType(showType).filter((p) => selectedCollections.has(p.name)),
      ...customCollections,
    ]))

    formData.set('checklist_templates', JSON.stringify([
      ...checklistPresets.filter((p) => selectedChecklist.has(p.task)),
      ...customChecklist,
    ]))

    formData.set('duty_templates', JSON.stringify([
      ...dutyPresets.filter((p) => selectedDuties.has(p.duty)),
      ...customDuties,
    ]))

    formData.set('comm_templates', JSON.stringify(
      skipComms ? [] : [
        ...commsPresets.filter((p) => selectedComms.has(p.name)),
        ...customComms,
      ]
    ))

    startTransition(async () => {
      const result = await createSeries(formData)
      if (result?.error) setErrors({ form: result.error })
    })
  }

  // ── Advance/skip helpers for steps 2–4 ──
  function advance() { setStep((s) => s + 1) }

  function skipStep(clearFn) {
    clearFn()
    advance()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal open={open} onClose={handleClose} title={STEP_TITLES[step]}>
      <form ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col gap-6" noValidate>

        {step > 1 && <StepProgress step={step} total={TOTAL_STEPS} />}

        {/* ── Step 1: Series details ── */}
        <div className={step === 1 ? undefined : 'hidden'} aria-hidden={step !== 1}>
          <div className="flex flex-col gap-6">
            <Input label="Series name" name="name" placeholder="e.g. Tuesday Night Live"
              error={errors.name} autoFocus={step === 1} required />

            <div className="flex flex-col gap-2">
              <FieldLabel required>Frequency</FieldLabel>
              <RadioGroup name="frequency" options={FREQUENCY_OPTIONS} value={frequency} onChange={setFrequency} />
              <p className="text-xs text-soft font-body mt-0.5">One-offs can be converted to recurring later.</p>
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required>Show type</FieldLabel>
              <RadioGroup name="show_type" options={SHOW_TYPE_OPTIONS} value={showType} onChange={setShowType} columns />
              {errors.show_type && <p className="text-xs text-red font-body">{errors.show_type}</p>}
            </div>

            {isOneOff && <Input label="Show date" name="date" type="date" error={errors.date} required />}

            <Input label="Default venue" name="venue" placeholder="e.g. The Comedy Store" />

            <div className="flex flex-col gap-2">
              <FieldLabel>Default times</FieldLabel>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Call time" name="call_time" type="time" />
                <Input label="Doors" name="doors_time" type="time" />
                <Input label="Show time" name="show_time" type="time" />
              </div>
            </div>

            <Input label="Default hosts" name="default_hosts" placeholder="e.g. Vi, Maddie, Emma" />
            <Input label="Tagline" name="tagline" placeholder="One sentence about your show" />
            <Textarea label="Elevator pitch" name="description_long"
              placeholder="A paragraph about your show for longer descriptions" maxLength={1000} />
          </div>
        </div>

        {/* ── Step 2: Collections ── */}
        {step === 2 && (
          <CollectionsStep
            presets={getCollPresetsForType(showType)}
            selected={selectedCollections}
            onToggle={(name) => setSelectedCollections((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })}
            custom={customCollections}
            onAddCustom={(c) => setCustomCollections((prev) => [...prev, c])}
            onRemoveCustom={(i) => setCustomCollections((prev) => prev.filter((_, j) => j !== i))}
          />
        )}

        {/* ── Step 3: Checklist ── */}
        {step === 3 && (
          <ChecklistStep
            presets={checklistPresets}
            selected={selectedChecklist}
            onToggle={(task) => setSelectedChecklist((prev) => { const n = new Set(prev); n.has(task) ? n.delete(task) : n.add(task); return n })}
            custom={customChecklist}
            onAddCustom={(c) => setCustomChecklist((prev) => [...prev, c])}
            onRemoveCustom={(i) => setCustomChecklist((prev) => prev.filter((_, j) => j !== i))}
          />
        )}

        {/* ── Step 4: Duties ── */}
        {step === 4 && (
          <DutiesStep
            presets={dutyPresets}
            selected={selectedDuties}
            onToggle={(duty) => setSelectedDuties((prev) => { const n = new Set(prev); n.has(duty) ? n.delete(duty) : n.add(duty); return n })}
            custom={customDuties}
            onAddCustom={(c) => setCustomDuties((prev) => [...prev, c])}
            onRemoveCustom={(i) => setCustomDuties((prev) => prev.filter((_, j) => j !== i))}
          />
        )}

        {/* ── Step 5: Comms ── */}
        {step === 5 && (
          <CommsStep
            presets={commsPresets}
            selected={selectedComms}
            onToggle={(name) => setSelectedComms((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })}
            custom={customComms}
            onAddCustom={(c) => setCustomComms((prev) => [...prev, c])}
            onRemoveCustom={(i) => setCustomComms((prev) => prev.filter((_, j) => j !== i))}
          />
        )}

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-2">{errors.form}</p>
        )}

        {/* ── Footer buttons ── */}
        <div className="flex justify-between gap-3 pt-1">

          {/* Left: Cancel / Back */}
          {step === 1 ? (
            <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="md" onClick={() => setStep((s) => s - 1)} disabled={isPending}>
              ← Back
            </Button>
          )}

          {/* Right: Skip + Next/Create */}
          <div className="flex items-center gap-2">
            {step >= 2 && step < TOTAL_STEPS && (
              <Button type="button" variant="ghost" size="md" disabled={isPending}
                onClick={() => {
                  if (step === 2) skipStep(() => { setSelectedCollections(new Set()); setCustomCollections([]) })
                  else if (step === 3) skipStep(() => { setSelectedChecklist(new Set()); setCustomChecklist([]) })
                  else if (step === 4) skipStep(() => { setSelectedDuties(new Set()); setCustomDuties([]) })
                }}>
                Skip
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button type="button" variant="ghost" size="md" disabled={isPending}
                onClick={() => doSubmit({ skipComms: true })}>
                Skip
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              step === 1 ? (
                <Button type="submit" variant="primary" size="md" loading={isPending}>Next →</Button>
              ) : (
                <Button type="button" variant="primary" size="md" disabled={isPending} onClick={advance}>Next →</Button>
              )
            ) : (
              <Button type="submit" variant="primary" size="md" loading={isPending}>
                {isOneOff ? 'Create show' : 'Create series'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}
