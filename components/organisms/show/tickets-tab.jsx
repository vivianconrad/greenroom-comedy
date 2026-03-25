'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateTicketInfo } from '@/lib/actions/show'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Card } from '@/components/atoms/card'
import { CopyBadge } from '@/components/atoms/copy-badge'

function StatCard({ label, value }) {
  return (
    <Card className="p-5 text-center">
      <div className="text-3xl font-display font-bold text-coral leading-none">{value}</div>
      <div className="text-xs text-soft mt-2">{label}</div>
    </Card>
  )
}

export function TicketsTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)

  const [form, setForm] = useState({
    ticket_platform: show.ticket_platform ?? '',
    ticket_price: show.ticket_price ?? '',
    ticket_url: show.ticket_url ?? '',
    promo_code: show.promo_code ?? '',
    capacity: show.capacity ?? '',
  })

  const sold = show.tickets_sold ?? 0
  const price = parseFloat(form.ticket_price) || 0
  const revenue = sold * price

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await updateTicketInfo(show.id, {
      ticket_price: form.ticket_price !== '' ? parseFloat(form.ticket_price) : null,
      ticket_platform: form.ticket_platform || null,
      ticket_url: form.ticket_url || null,
      promo_code: form.promo_code || null,
      capacity: form.capacity !== '' ? parseInt(form.capacity) : null,
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
  }

  const hasTicketLink = !!form.ticket_url
  const hasPromoCode = !!form.promo_code

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Quick links */}
      {(hasTicketLink || hasPromoCode) && (
        <div className="flex flex-wrap items-center gap-3">
          {hasTicketLink && (
            <a
              href={form.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral text-white text-sm font-body font-medium hover:bg-coral/90 transition-colors"
            >
              Buy tickets ↗
            </a>
          )}
          {hasPromoCode && (
            <CopyBadge label="Promo:" value={form.promo_code} />
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Tickets sold" value={sold} />
        <StatCard label="Ticket price" value={price > 0 ? `$${price.toFixed(2)}` : '—'} />
        <StatCard label="Gross revenue" value={revenue > 0 ? `$${revenue.toFixed(2)}` : '—'} />
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-card border border-peach p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-lg text-deep">Ticket details</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-soft">{saved ? 'Saved' : 'Unsaved changes'}</span>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Platform"
            value={form.ticket_platform}
            onChange={(e) => handleChange('ticket_platform', e.target.value)}
            placeholder="e.g. Eventbrite, Humanitix"
          />
          <Input
            label="Price ($)"
            type="number"
            min="0"
            step="0.01"
            value={form.ticket_price}
            onChange={(e) => handleChange('ticket_price', e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Ticket URL"
            value={form.ticket_url}
            onChange={(e) => handleChange('ticket_url', e.target.value)}
            placeholder="https://..."
            className="sm:col-span-2"
          />
          <Input
            label="Promo code"
            value={form.promo_code}
            onChange={(e) => handleChange('promo_code', e.target.value)}
            placeholder="e.g. GREENROOM20"
          />
          <Input
            label="Capacity"
            type="number"
            min="0"
            value={form.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            placeholder="e.g. 80"
          />
        </div>
      </div>
    </div>
  )
}
