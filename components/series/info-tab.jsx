'use client'

import { useState, useRef, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateSeriesInfo } from '@/lib/actions/series'

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
        <Input
          label="Username / Email"
          value={entry.username}
          onChange={(e) => onChange('username', e.target.value)}
          placeholder="username or email"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Password with show/hide toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-soft font-body">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={entry.password}
              onChange={(e) => onChange('password', e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-card border border-peach bg-white px-3 py-2 text-sm font-body text-deep focus:outline-none focus:ring-2 focus:ring-coral/30 pr-14"
            />
            {entry.password && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-soft hover:text-mid font-body transition-colors"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
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

// ─── Main export ──────────────────────────────────────────────────────────────

export function InfoTab({ series, seriesId }) {
  const [, startTransition] = useTransition()
  const timerRef = useRef(null)
  const dataRef = useRef(null)
  const [saved, setSaved] = useState(true)
  const [saveError, setSaveError] = useState(null)

  const [localData, setLocalData] = useState({
    logins: series.logins ?? [],
    internal_notes: series.internal_notes ?? '',
  })

  dataRef.current = localData

  function applySaveResult(result) {
    if (result?.error) {
      setSaveError(result.error)
    } else {
      setSaved(true)
    }
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

  function handleNotesChange(value) {
    setLocalData((prev) => ({ ...prev, internal_notes: value }))
    triggerAutoSave()
  }

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
    setLocalData((prev) => ({
      ...prev,
      logins: prev.logins.filter((l) => l.id !== id),
    }))
    triggerAutoSave()
  }

  function handleManualSave() {
    clearTimeout(timerRef.current)
    setSaveError(null)
    startTransition(async () => {
      applySaveResult(await updateSeriesInfo(seriesId, localData))
    })
  }

  return (
    <div className="pt-6 max-w-2xl space-y-10">

      {/* ── Save status ── */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex items-center gap-3">
          {saveError
            ? <span className="text-xs text-red font-body">{saveError}</span>
            : <span className="text-xs text-soft font-body">{saved ? 'Saved' : 'Saving…'}</span>
          }
          <Button variant="secondary" size="sm" onClick={handleManualSave}>
            Save
          </Button>
        </div>
      </div>

      {/* ── Account logins ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg text-deep">Account logins</h3>
            <p className="text-xs text-soft font-body mt-0.5">
              Instagram, Eventbrite, Canva, ticketing platforms, etc.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addLogin}>
            + Add login
          </Button>
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

      {/* ── Internal notes ── */}
      <section>
        <h3 className="font-display text-lg text-deep mb-1">Series notes</h3>
        <p className="text-xs text-soft font-body mb-4">
          General info, running notes, things to remember between shows.
        </p>
        <Textarea
          value={localData.internal_notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Venue load-in notes, recurring sponsor contacts, things that always come up…"
          rows={8}
        />
      </section>

    </div>
  )
}
