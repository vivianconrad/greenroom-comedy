'use client'

import Link from 'next/link'
import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { Pill } from '@/components/atoms/pill'
import { updateSeriesInfo } from '@/lib/actions/series'

const CONTACT_ROLES = [
  { value: 'Venue Manager',     label: 'Venue Manager' },
  { value: 'Box Office',        label: 'Box Office' },
  { value: 'Bar Manager',       label: 'Bar Manager' },
  { value: 'Sound Engineer',    label: 'Sound Engineer' },
  { value: 'AV Tech',           label: 'AV Tech' },
  { value: 'Lighting Tech',     label: 'Lighting Tech' },
  { value: 'Stage Manager',     label: 'Stage Manager' },
  { value: 'Photographer',      label: 'Photographer' },
  { value: 'Videographer',      label: 'Videographer' },
  { value: 'Graphic Designer',  label: 'Graphic Designer' },
  { value: 'Producer',          label: 'Producer' },
  { value: 'Publicist',         label: 'Publicist' },
  { value: 'Sponsor Contact',   label: 'Sponsor Contact' },
  { value: 'Ticketing Contact', label: 'Ticketing Contact' },
  { value: 'Other',             label: 'Other…' },
]

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!value}
      className="text-xs text-soft hover:text-coral font-body transition-colors disabled:opacity-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function CopyField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-soft font-body">{label}</label>
        <CopyButton value={value} />
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-card border border-peach bg-white px-3 py-2 text-sm font-body text-deep focus:outline-none focus:ring-2 focus:ring-coral/30"
      />
    </div>
  )
}

// ─── Contact card ─────────────────────────────────────────────────────────────

function ContactCard({ entry, onChange, onRemove }) {
  const isCustomRole = entry.role && !CONTACT_ROLES.some((r) => r.value === entry.role)
  const selectValue = isCustomRole ? 'Other' : (entry.role ?? '')

  function handleRoleSelect(e) {
    const val = e.target.value
    if (val !== 'Other') onChange('role', val)
    else onChange('role', '')
  }

  return (
    <div className="rounded-card border border-peach bg-white p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Name"
          value={entry.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. Jamie"
        />
        <Select
          label="Role"
          value={selectValue}
          onChange={handleRoleSelect}
          options={CONTACT_ROLES}
          placeholder="Select a role…"
        />
      </div>

      {(selectValue === 'Other' || isCustomRole) && (
        <Input
          label="Custom role"
          value={isCustomRole ? entry.role : ''}
          onChange={(e) => onChange('role', e.target.value)}
          placeholder="e.g. Lighting Tech, Security"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CopyField
          label="Phone"
          value={entry.phone}
          onChange={(v) => onChange('phone', v)}
          placeholder="+1 555 000 0000"
          type="tel"
        />
        <CopyField
          label="Email"
          value={entry.email}
          onChange={(v) => onChange('email', v)}
          placeholder="email@example.com"
          type="email"
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Notes"
            value={entry.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="e.g. text don't call, usually replies same day"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mb-0.5 text-xs text-soft hover:text-red font-body transition-colors px-1.5 py-2 shrink-0"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── Performer row (read-only) ─────────────────────────────────────────────────

function PerformerRow({ performer }) {
  const contact = performer.instagram
    ? `@${performer.instagram}`
    : performer.email ?? null

  return (
    <Link
      href={`/dashboard/performers`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-cream/60 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm font-body text-deep font-medium">{performer.name}</span>
        {performer.act_type && (
          <span className="ml-2 text-xs font-body text-soft">({performer.act_type})</span>
        )}
      </div>
      {contact && (
        <span className="text-xs font-body text-soft shrink-0">{contact}</span>
      )}
      <span className="text-xs text-soft/50 font-body shrink-0 tabular-nums">
        {performer.showCount} {performer.showCount === 1 ? 'show' : 'shows'}
      </span>
      <span className="text-xs text-soft group-hover:text-coral transition-colors shrink-0">→</span>
    </Link>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ContactsTab({ series, seriesId, performers = [] }) {
  const [, startTransition] = useTransition()
  const timerRef = useRef(null)
  const contactsRef = useRef(null)
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState(null)
  const [contacts, setContacts] = useState(series.contacts ?? [])

  contactsRef.current = contacts

  function triggerAutoSave() {
    setSaved(false)
    setSaveError(null)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await updateSeriesInfo(seriesId, {
          logins: series.logins ?? [],
          contacts: contactsRef.current,
          internal_notes: series.internal_notes ?? '',
        })
        if (result?.error) setSaveError(result.error)
        else setSaved(true)
      })
    }, 800)
  }

  function handleManualSave() {
    clearTimeout(timerRef.current)
    setSaveError(null)
    startTransition(async () => {
      const result = await updateSeriesInfo(seriesId, {
        logins: series.logins ?? [],
        contacts,
        internal_notes: series.internal_notes ?? '',
      })
      if (result?.error) setSaveError(result.error)
      else setSaved(true)
    })
  }

  function updateContact(id, field, value) {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
    triggerAutoSave()
  }

  function addContact() {
    setContacts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', role: '', phone: '', email: '', notes: '' },
    ])
    triggerAutoSave()
  }

  function removeContact(id) {
    setContacts((prev) => prev.filter((c) => c.id !== id))
    triggerAutoSave()
  }

  return (
    <div className="pt-6 max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-body text-soft">
            Venue manager, sound engineer, photographer — people you work with every show cycle. Separate from your performer database.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saveError
            ? <span className="text-xs text-red font-body">{saveError}</span>
            : <span className="text-xs text-soft font-body">{saved ? 'Saved' : 'Saving…'}</span>
          }
          <Button variant="secondary" size="sm" onClick={handleManualSave}>Save</Button>
          <Button variant="secondary" size="sm" onClick={addContact}>+ Add contact</Button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-card border border-dashed border-peach px-6 py-12 text-center">
          <p className="text-sm text-soft font-body">No contacts saved yet.</p>
          <button
            type="button"
            onClick={addContact}
            className="mt-2 text-sm text-coral hover:underline font-body"
          >
            Add your first contact
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contacts.map((entry) => (
            <ContactCard
              key={entry.id}
              entry={entry}
              onChange={(field, value) => updateContact(entry.id, field, value)}
              onRemove={() => removeContact(entry.id)}
            />
          ))}
        </div>
      )}

      {/* ── Performers (read-only) ── */}
      {performers.length > 0 && (
        <section className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-base text-deep">Performers</h3>
              <p className="text-xs text-soft font-body mt-0.5">From your performer database — manage them in the Performers tab.</p>
            </div>
            <Link
              href="/dashboard/performers"
              className="text-xs text-coral hover:underline font-body shrink-0"
            >
              Open database →
            </Link>
          </div>
          <div className="rounded-card border border-peach bg-white divide-y divide-peach overflow-hidden">
            {performers.map((p) => (
              <PerformerRow key={p.id} performer={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
