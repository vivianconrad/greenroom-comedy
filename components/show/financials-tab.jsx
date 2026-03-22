'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePerformerPaid } from '@/lib/actions/show'
import { Pill } from '@/components/ui/pill'
import { Card } from '@/components/ui/card'

function StatCard({ label, value, muted }) {
  return (
    <Card className="p-5 text-center">
      <div
        className={`text-3xl font-display font-bold leading-none ${muted ? 'text-mid' : 'text-coral'}`}
      >
        {value}
      </div>
      <div className="text-xs text-soft mt-2">{label}</div>
    </Card>
  )
}

function fmt(amount) {
  if (amount == null || amount === '') return '—'
  return `$${Number(amount).toFixed(2)}`
}

export function FinancialsTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const revenue = (show.ticket_count ?? 0) * (show.ticket_price ?? 0)

  const venueExpenses = show.venue_cost
    ? [{ key: 'venue', label: 'Venue', amount: show.venue_cost, is_paid: true, type: 'fixed' }]
    : []

  const performerExpenses = show.performers.map((p) => ({
    key: p.showPerformerId,
    label: p.name,
    amount: p.payment_amount,
    is_paid: p.is_paid,
    type: 'performer',
    showPerformerId: p.showPerformerId,
  }))

  const allExpenses = [...venueExpenses, ...performerExpenses]
  const totalExpenses = allExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
  const net = revenue - totalExpenses

  function handleTogglePaid(showPerformerId) {
    startTransition(async () => {
      await togglePerformerPaid(showPerformerId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Revenue" value={fmt(revenue)} />
        <StatCard label="Expenses" value={fmt(totalExpenses)} muted />
        <StatCard label="Net" value={fmt(net)} />
      </div>

      {/* Expenses table */}
      <div className="bg-white rounded-card border border-peach">
        <div className="px-5 py-3 border-b border-peach">
          <h3 className="font-display text-base text-deep">Expenses</h3>
        </div>
        {allExpenses.length === 0 ? (
          <p className="px-5 py-8 text-sm text-soft text-center">
            No expense data. Set a venue cost on the show and payment amounts on performers.
          </p>
        ) : (
          <div className="divide-y divide-peach">
            {allExpenses.map((e) => (
              <div key={e.key} className="flex items-center gap-3 px-5 py-3">
                <div className="flex-1 text-sm text-deep">{e.label}</div>
                <span className="text-sm font-medium text-deep tabular-nums">{fmt(e.amount)}</span>
                {e.type === 'performer' ? (
                  <button onClick={() => handleTogglePaid(e.showPerformerId)}>
                    <Pill
                      variant={e.is_paid ? 'success' : 'warning'}
                      className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {e.is_paid ? 'Paid' : 'Unpaid'}
                    </Pill>
                  </button>
                ) : (
                  <Pill variant="neutral" className="text-xs">
                    Fixed
                  </Pill>
                )}
              </div>
            ))}
            {/* Totals row */}
            <div className="flex items-center gap-3 px-5 py-3 bg-cream/50">
              <div className="flex-1 text-sm font-medium text-deep">Total expenses</div>
              <span className="text-sm font-bold text-deep tabular-nums">
                {fmt(totalExpenses)}
              </span>
              <div className="w-16" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
