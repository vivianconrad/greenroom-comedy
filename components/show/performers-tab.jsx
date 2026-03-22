'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn, formatTime } from '@/lib/utils'
import {
  togglePerformerPaid,
  updatePerformerRole,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
} from '@/lib/actions/show'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { Card } from '@/components/ui/card'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ['performer', 'host', 'headliner', 'opener', 'other']

const ROLE_PILL_STYLES = {
  host:      'bg-lav-bg text-lav',
  headliner: 'bg-coral/20 text-coral',
  opener:    'bg-peach text-mid',
  performer: 'bg-sage-bg text-green',
  other:     'bg-cream text-soft',
}

const CREW_ROLE_SUGGESTIONS = [
  'Tech', 'Camera', 'Sound', 'Lighting', 'Stage Manager', 'Producer', 'Other',
]

// ── Small shared components ───────────────────────────────────────────────────

function StatusPill({ status }) {
  if (status === 'confirmed')   return <Pill variant="success" className="text-xs">Ready</Pill>
  if (status === 'form_pending') return <Pill variant="warning" className="text-xs">Form pending</Pill>
  if (status === 'invited')     return <Pill variant="neutral" className="text-xs">Unconfirmed</Pill>
  return <Pill variant="neutral" className="text-xs">TBD</Pill>
}

function RolePill({ role }) {
  if (!role || role === 'performer') return null
  const cls = ROLE_PILL_STYLES[role] ?? 'bg-cream text-soft'
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        cls
      )}
    >
      {role}
    </span>
  )
}

function DetailSection({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-soft uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-deep mt-0.5">{value}</dd>
    </div>
  )
}

// Shared input/select classes used in crew forms
const fieldCls =
  'w-full h-9 px-3 text-sm rounded-lg border border-peach bg-white text-deep placeholder:text-soft/60 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral'

// ── Crew form (add) ───────────────────────────────────────────────────────────

function AddCrewForm({ showId, onClose }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '',
    role: '',
    contact_method: '',
    contact_info: '',
    call_time: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    startTransition(async () => {
      await createCrewMember(showId, form)
      router.refresh()
      onClose()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-card border border-peach p-4 mb-3"
    >
      <p className="text-xs font-medium text-deep mb-3">New crew member</p>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className={fieldCls}
          placeholder="Name *"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          required
          autoFocus
        />
        <div>
          <input
            className={fieldCls}
            list="crew-role-suggestions"
            placeholder="Role (e.g. Sound)"
            value={form.role}
            onChange={(e) => set('role', e.target.value)}
          />
          <datalist id="crew-role-suggestions">
            {CREW_ROLE_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          className={fieldCls}
          placeholder="Contact method (e.g. Phone)"
          value={form.contact_method}
          onChange={(e) => set('contact_method', e.target.value)}
        />
        <input
          className={fieldCls}
          placeholder="Contact info"
          value={form.contact_info}
          onChange={(e) => set('contact_info', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="time"
          className={fieldCls}
          placeholder="Call time"
          value={form.call_time}
          onChange={(e) => set('call_time', e.target.value)}
        />
        <input
          className={fieldCls}
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving}>
          Add crew member
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Crew row (display + inline edit) ─────────────────────────────────────────

function CrewRow({ crew }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: crew.name,
    role: crew.role ?? '',
    contact_method: crew.contact_method ?? '',
    contact_info: crew.contact_info ?? '',
    call_time: crew.call_time ?? '',
    notes: crew.notes ?? '',
  })
  const [saving, setSaving] = useState(false)

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    startTransition(async () => {
      await updateCrewMember(crew.id, form)
      router.refresh()
      setEditing(false)
      setSaving(false)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCrewMember(crew.id)
      router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="px-4 py-3">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              className={fieldCls}
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              required
              autoFocus
            />
            <div>
              <input
                className={fieldCls}
                list="crew-role-suggestions-edit"
                placeholder="Role"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
              />
              <datalist id="crew-role-suggestions-edit">
                {CREW_ROLE_SUGGESTIONS.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              className={fieldCls}
              placeholder="Contact method"
              value={form.contact_method}
              onChange={(e) => setField('contact_method', e.target.value)}
            />
            <input
              className={fieldCls}
              placeholder="Contact info"
              value={form.contact_info}
              onChange={(e) => setField('contact_info', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              type="time"
              className={fieldCls}
              value={form.call_time}
              onChange={(e) => setField('call_time', e.target.value)}
            />
            <input
              className={fieldCls}
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={saving}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-deep">{crew.name}</span>
          {crew.role && (
            <span className="text-xs bg-cream text-soft px-2 py-0.5 rounded-full">
              {crew.role}
            </span>
          )}
        </div>
        {(crew.contact_info || crew.notes) && (
          <div className="text-xs text-soft mt-0.5">
            {crew.contact_info && (
              <span>
                {crew.contact_method ? `${crew.contact_method}: ` : ''}
                {crew.contact_info}
              </span>
            )}
            {crew.contact_info && crew.notes && <span className="mx-1">·</span>}
            {crew.notes && <span>{crew.notes}</span>}
          </div>
        )}
      </div>

      {crew.call_time && (
        <span className="text-xs text-soft shrink-0">{formatTime(crew.call_time)}</span>
      )}

      <div className="flex gap-1 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-soft hover:text-mid px-2 py-1 rounded hover:bg-peach transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-soft hover:text-red px-2 py-1 rounded hover:bg-red-bg transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PerformersTab({ show }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState(null)
  const [addingCrew, setAddingCrew] = useState(false)

  const selected = show.performers.find((p) => p.showPerformerId === selectedId)
  const crew = show.crew ?? []

  function handleMarkPaid(showPerformerId) {
    startTransition(async () => {
      await togglePerformerPaid(showPerformerId)
      router.refresh()
    })
  }

  function handleRoleChange(showPerformerId, role) {
    startTransition(async () => {
      await updatePerformerRole(showPerformerId, role)
      router.refresh()
    })
  }

  return (
    <div>
      {/* ── Performers section ─────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-soft">
          {show.performers.length} performer{show.performers.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2 flex-wrap">
          {show.performers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`${pathname}?tab=comms&group=performers`)}
            >
              ✉ Message performers
            </Button>
          )}
          <Link href="/dashboard/performers">
            <Button variant="ghost" size="sm">
              Browse database
            </Button>
          </Link>
          <Link href={`/dashboard/performers?addTo=${show.id}`}>
            <Button variant="secondary" size="sm">
              + Add performer
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Performer list */}
        <div className="flex-1 bg-white rounded-card border border-peach divide-y divide-peach">
          {show.performers.length === 0 && (
            <p className="px-4 py-10 text-center text-soft text-sm">No performers added yet.</p>
          )}
          {show.performers.map((p) => (
            <div
              key={p.showPerformerId}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-cream/60 transition-colors',
                selectedId === p.showPerformerId && 'bg-cream'
              )}
              onClick={() =>
                setSelectedId(selectedId === p.showPerformerId ? null : p.showPerformerId)
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-deep">
                    {p.name}
                    {p.pronouns && (
                      <span className="text-soft font-normal ml-1.5 text-xs">({p.pronouns})</span>
                    )}
                  </span>
                  <RolePill role={p.role} />
                </div>
                {p.performer_type && <div className="text-xs text-soft">{p.performer_type}</div>}
              </div>
              {p.set_length != null && (
                <span className="text-xs text-soft shrink-0">{p.set_length}m</span>
              )}
              {p.call_time && (
                <span className="text-xs text-soft shrink-0">{formatTime(p.call_time)}</span>
              )}
              <StatusPill status={p.status} />
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-72 shrink-0">
            <Card className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-deep">{selected.name}</h3>
                  {selected.pronouns && (
                    <p className="text-xs text-soft">{selected.pronouns}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-soft hover:text-mid text-xl leading-none ml-2"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Role selector */}
              <div className="mb-4">
                <label className="text-xs text-soft uppercase tracking-wide block mb-1">
                  Role
                </label>
                <select
                  value={selected.role ?? 'performer'}
                  onChange={(e) => handleRoleChange(selected.showPerformerId, e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-lg border border-peach bg-white text-deep capitalize focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral cursor-pointer"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <dl className="space-y-3 mb-4">
                <DetailSection label="Bio" value={selected.bio} />
                <DetailSection label="Walk-up song" value={selected.walk_up_song} />
                {selected.instagram && (
                  <div>
                    <dt className="text-xs text-soft uppercase tracking-wide">Instagram</dt>
                    <dd className="text-sm mt-0.5">
                      <a
                        href={`https://instagram.com/${selected.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-coral hover:underline"
                      >
                        {selected.instagram}
                      </a>
                    </dd>
                  </div>
                )}
                <DetailSection
                  label="Superlatives"
                  value={selected.superlative_suggestions}
                />
              </dl>

              <div className="flex flex-wrap gap-2 mb-4">
                {selected.tags_ok === true && (
                  <Pill variant="success" className="text-xs">Tags OK</Pill>
                )}
                {selected.tags_ok === false && (
                  <Pill variant="warning" className="text-xs">No tags</Pill>
                )}
                <Pill variant={selected.is_paid ? 'success' : 'neutral'} className="text-xs">
                  {selected.is_paid ? 'Paid' : 'Payment pending'}
                </Pill>
              </div>

              <Button
                variant={selected.is_paid ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => handleMarkPaid(selected.showPerformerId)}
                className="w-full"
              >
                {selected.is_paid ? 'Mark unpaid' : 'Mark paid'}
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* ── Crew section ───────────────────────────────────────────────── */}
      <section className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-deep">
            Crew
            {crew.length > 0 && (
              <span className="ml-1.5 text-soft font-normal">{crew.length}</span>
            )}
          </h2>
          {!addingCrew && (
            <Button variant="secondary" size="sm" onClick={() => setAddingCrew(true)}>
              + Add crew member
            </Button>
          )}
        </div>

        {addingCrew && (
          <AddCrewForm showId={show.id} onClose={() => setAddingCrew(false)} />
        )}

        <div className="bg-white rounded-card border border-peach divide-y divide-peach">
          {crew.length === 0 && !addingCrew && (
            <p className="px-4 py-6 text-center text-soft text-sm">
              No crew added yet. Crew are support staff who don&apos;t appear in the run of show.
            </p>
          )}
          {crew.map((c) => (
            <CrewRow key={c.id} crew={c} />
          ))}
        </div>
      </section>
    </div>
  )
}
