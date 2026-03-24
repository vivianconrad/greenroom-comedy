'use client'

import { useState, useTransition } from 'react'
import { submitIntakeForm } from '@/lib/actions/intake'

export function IntakeForm({ intake }) {
  const [form, setForm] = useState({
    bio: intake.bio ?? '',
    walk_up_song: intake.walk_up_song ?? '',
    tags_ok: intake.tags_ok,
  })
  const [submitted, setSubmitted] = useState(intake.form_complete)
  const [error, setError] = useState(null)
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    startTransition(async () => {
      const result = await submitIntakeForm(intake.showPerformerId, form)
      if (result?.error) {
        setError(result.error)
        setSaving(false)
      } else {
        setSubmitted(true)
      }
    })
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-display text-2xl text-deep mb-2">You&apos;re all set!</h2>
        <p className="text-soft font-body">
          We&apos;ve got your details. See you at the show!
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-deep font-body mb-1.5">
          Bio
          <span className="text-soft font-normal ml-1">(used in promos and on the night)</span>
        </label>
        <textarea
          value={form.bio}
          onChange={(e) => set('bio', e.target.value)}
          placeholder="A short bio audiences will hear when you're introduced…"
          rows={4}
          className="w-full rounded-card border border-peach bg-white px-4 py-3 text-sm font-body text-deep leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </div>

      {/* Walk-up song */}
      <div>
        <label className="block text-sm font-medium text-deep font-body mb-1.5">
          Walk-up song
          <span className="text-soft font-normal ml-1">(optional)</span>
        </label>
        <input
          type="text"
          value={form.walk_up_song}
          onChange={(e) => set('walk_up_song', e.target.value)}
          placeholder="e.g. Flawless – Beyoncé"
          className="w-full h-10 rounded-lg border border-peach bg-white px-3 text-sm font-body text-deep focus:outline-none focus:ring-2 focus:ring-coral/30"
        />
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm font-medium text-deep font-body mb-2">
          Are you OK to be tagged on social media?
        </p>
        <div className="flex flex-col gap-2">
          {[
            { value: true,  label: 'Yes — tag me!' },
            { value: false, label: 'No thanks, please don\'t tag me' },
          ].map(({ value, label }) => (
            <label key={String(value)} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="tags_ok"
                checked={form.tags_ok === value}
                onChange={() => set('tags_ok', value)}
                className="accent-coral w-4 h-4 shrink-0"
              />
              <span className="text-sm font-body text-deep">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red font-body">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full h-11 rounded-lg bg-coral hover:bg-coral-hover text-cream font-body font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? 'Submitting…' : 'Submit'}
      </button>

      <p className="text-xs text-soft font-body text-center">
        You can re-submit this form to update your details at any time.
      </p>
    </form>
  )
}
