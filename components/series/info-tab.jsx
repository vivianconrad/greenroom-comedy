'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateSeriesInfo } from '@/lib/actions/series'

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

// ─── Field with label + copy button ──────────────────────────────────────────

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

// ─── Login card ───────────────────────────────────────────────────────────────

function LoginCard({ entry, onChange, onRemove }) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="rounded-card border border-peach bg-white p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Service"
          value={entry.service}
          onChange={(e) => onChange('service', e.target.value)}
          placeholder="e.g. Instagram, Eventbrite, Canva"
        />
        <CopyField
          label="Username / Email"
          value={entry.username}
          onChange={(v) => onChange('username', v)}
          placeholder="username or email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password with show/hide + copy */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-soft font-body">Password</label>
            <div className="flex items-center gap-2">
              <CopyButton value={entry.password} />
              {entry.password && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-xs text-soft hover:text-mid font-body transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={entry.password}
            onChange={(e) => onChange('password', e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-card border border-peach bg-white px-3 py-2 text-sm font-body text-deep focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>

        <Input
          label="URL"
          type="url"
          value={entry.url}
          onChange={(e) => onChange('url', e.target.value)}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Notes"
            value={entry.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="e.g. shared account, 2FA on Vi's phone"
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

// ─── Contact card ─────────────────────────────────────────────────────────────

function ContactCard({ entry, onChange, onRemove }) {
  return (
    <div className="rounded-card border border-peach bg-white p-4 flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Name"
          value={entry.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. Jamie"
        />
        <Input
          label="Role"
          value={entry.role}
          onChange={(e) => onChange('role', e.target.value)}
          placeholder="e.g. Venue Manager, Sound Engineer"
        />
      </div>

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

// ─── Main export ──────────────────────────────────────────────────────────────

export function InfoTab({ series, seriesId }) {
  const [, startTransition] = useTransition()
  const timerRef = useRef(null)
  const dataRef = useRef(null)
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState(null)

  const [localData, setLocalData] = useState({
    logins: series.logins ?? [],
    contacts: series.contacts ?? [],
    internal_notes: series.internal_notes ?? '',
  })

  dataRef.current = localData

  function applySaveResult(result) {
    if (result?.error) setSaveError(result.error)
    else setSaved(true)
  }

  function triggerAutoSave() {
    setSaved(false)
    setSaveError(null)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        applySaveResult(await updateSeriesInfo(seriesId, dataRef.current))
      })
    }, 800)
  }

  function handleManualSave() {
    clearTimeout(timerRef.current)
    setSaveError(null)
    startTransition(async () => {
      applySaveResult(await updateSeriesInfo(seriesId, localData))
    })
  }

  // ── Login handlers ──────────────────────────────────────────────────────────

  function updateLogin(id, field, value) {
    setLocalData((prev) => ({
      ...prev,
      logins: prev.logins.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    }))
    triggerAutoSave()
  }

  function addLogin() {
    setLocalData((prev) => ({
      ...prev,
      logins: [
        ...prev.logins,
        { id: crypto.randomUUID(), service: '', username: '', password: '', url: '', notes: '' },
      ],
    }))
    triggerAutoSave()
  }

  function removeLogin(id) {
    setLocalData((prev) => ({ ...prev, logins: prev.logins.filter((l) => l.id !== id) }))
    triggerAutoSave()
  }

  // ── Contact handlers ────────────────────────────────────────────────────────

  function updateContact(id, field, value) {
    setLocalData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    }))
    triggerAutoSave()
  }

  function addContact() {
    setLocalData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        { id: crypto.randomUUID(), name: '', role: '', phone: '', email: '', notes: '' },
      ],
    }))
    triggerAutoSave()
  }

  function removeContact(id) {
    setLocalData((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }))
    triggerAutoSave()
  }

  return (
    <div className="pt-6 max-w-2xl space-y-10">

      {/* ── Save status ── */}
      <div className="flex items-center justify-end gap-3">
        {saveError
          ? <span className="text-xs text-red font-body">{saveError}</span>
          : <span className="text-xs text-soft font-body">{saved ? 'Saved' : 'Saving…'}</span>
        }
        <Button variant="secondary" size="sm" onClick={handleManualSave}>Save</Button>
      </div>

      {/* ── Regular contacts ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg text-deep">Regular contacts</h3>
            <p className="text-xs text-soft font-body mt-0.5">
              Venue manager, sound engineer, photographer — people you work with every show cycle. Separate from your performer database.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addContact}>+ Add contact</Button>
        </div>

        {localData.contacts.length === 0 ? (
          <div className="rounded-card border border-dashed border-peach px-6 py-8 text-center">
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
            {localData.contacts.map((entry) => (
              <ContactCard
                key={entry.id}
                entry={entry}
                onChange={(field, value) => updateContact(entry.id, field, value)}
                onRemove={() => removeContact(entry.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Account logins ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg text-deep">Account logins</h3>
            <p className="text-xs text-soft font-body mt-0.5">
              Instagram, Eventbrite, Canva, ticketing platforms, etc.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addLogin}>+ Add login</Button>
        </div>

        {localData.logins.length === 0 ? (
          <div className="rounded-card border border-dashed border-peach px-6 py-8 text-center">
            <p className="text-sm text-soft font-body">No logins saved yet.</p>
            <button
              type="button"
              onClick={addLogin}
              className="mt-2 text-sm text-coral hover:underline font-body"
            >
              Add your first login
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {localData.logins.map((entry) => (
              <LoginCard
                key={entry.id}
                entry={entry}
                onChange={(field, value) => updateLogin(entry.id, field, value)}
                onRemove={() => removeLogin(entry.id)}
              />
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-soft/70 font-body">
          Stored for convenience — not encrypted. Don't use this for anything more sensitive than a shared social media account.
        </p>
      </section>

      {/* ── Series notes ── */}
      <section>
        <h3 className="font-display text-lg text-deep mb-1">Series notes</h3>
        <p className="text-xs text-soft font-body mb-4">
          General info, running notes, things to remember between shows.
        </p>
        <Textarea
          value={localData.internal_notes}
          onChange={(e) => {
            setLocalData((prev) => ({ ...prev, internal_notes: e.target.value }))
            triggerAutoSave()
          }}
          placeholder="Venue load-in notes, recurring sponsor contacts, things that always come up…"
          rows={8}
        />
      </section>

    </div>
  )
}
