'use client'

import { useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn, formatTime, daysUntil } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/show'
import { Card } from '@/components/atoms/card'
import { Pill } from '@/components/atoms/pill'
import { ProgressBar } from '@/components/atoms/progress-bar'

function StatusPill({ status }) {
  if (status === 'confirmed') return <Pill variant="success" className="text-xs">Ready</Pill>
  if (status === 'form_pending') return <Pill variant="warning" className="text-xs">Form pending</Pill>
  if (status === 'invited') return <Pill variant="neutral" className="text-xs">Unconfirmed</Pill>
  return <Pill variant="neutral" className="text-xs">TBD</Pill>
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-soft shrink-0">{label}</dt>
      <dd className="text-deep font-medium text-right">{value}</dd>
    </div>
  )
}

export function DashboardTab({ show }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const threeDays = new Date(today)
  threeDays.setDate(today.getDate() + 3)

  const activeItems = (show.checklistItems ?? []).filter((i) => i.enabled !== false)
  const total = activeItems.length
  const done = activeItems.filter((i) => i.done).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const remaining = total - done
  const overdueCount = activeItems.filter((i) => {
    if (i.done || !i.due_date) return false
    return new Date(i.due_date) < today
  }).length

  const needsAttention = activeItems
    .filter((i) => {
      if (i.done || !i.due_date) return false
      return new Date(i.due_date) < threeDays
    })
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  function handleToggle(itemId) {
    startTransition(async () => {
      await toggleChecklistItem(itemId)
      router.refresh()
    })
  }

  const venue = show.venue ?? show.series?.venue

  // 3-day comms prompt + debrief prompt
  const daysToShow = daysUntil(show.date)
  const showingSoon = daysToShow >= 0 && daysToShow <= 3
  const isPastShow = daysToShow < 0
  const showDebriefBanner = isPastShow && show.status !== 'cancelled' && show.status !== 'completed'
  const hasNotes = show.notes_rating != null || (show.notes_attendance != null && show.notes_attendance !== '')
  const unpaidCount = show.performers.filter((p) => p.payment_amount > 0 && !p.paid).length
  const debriefItems = [
    !hasNotes && 'Notes not filled in',
    unpaidCount > 0 && `${unpaidCount} performer${unpaidCount !== 1 ? 's' : ''} unpaid`,
  ].filter(Boolean)
  const callTimeTemplate = (show.commTemplates ?? []).find((t) =>
    /call.?time|reminder|running.?order/i.test(t.name)
  )
  const commsUrl = callTimeTemplate
    ? `${pathname}?tab=comms&group=performers&template=${callTimeTemplate.id}`
    : `${pathname}?tab=comms&group=performers`

  return (
    <div className="space-y-4">
      {/* ── 3-day comms prompt ── */}
      {showingSoon && (
        <div className="flex items-center justify-between gap-4 rounded-card border border-coral/30 bg-coral/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-deep font-body">
              {daysToShow === 0 ? 'Tonight! Send final details to your performers?' : `${daysToShow}d away — send call time + running order?`}
            </p>
            <p className="text-xs text-soft font-body mt-0.5">
              Call: {formatTime(show.call_time) ?? 'not set'} · Doors: {formatTime(show.doors_time) ?? 'not set'} · Show: {formatTime(show.show_time) ?? 'not set'}
            </p>
          </div>
          <button
            onClick={() => router.push(commsUrl)}
            className="shrink-0 text-sm font-medium text-coral hover:underline font-body"
          >
            Go to Comms →
          </button>
        </div>
      )}

      {/* ── Post-show debrief prompt ── */}
      {showDebriefBanner && (
        <div className="flex items-center justify-between gap-4 rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-deep font-body">Post-show debrief</p>
            <p className="text-xs text-mid font-body mt-0.5">
              {debriefItems.length > 0 ? debriefItems.join(' · ') : 'Ready to mark as done?'}
            </p>
          </div>
          <button
            onClick={() => router.push(`${pathname}?tab=notes`)}
            className="shrink-0 text-sm font-medium text-amber-700 hover:underline font-body whitespace-nowrap"
          >
            Go to Notes →
          </button>
        </div>
      )}

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Progress */}
      <Card className="p-6">
        <h3 className="font-display text-lg text-deep mb-4">Progress</h3>
        {total === 0 ? (
          <p className="text-soft text-sm">No checklist items yet.</p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="text-7xl font-display font-bold text-coral leading-none">
                {progress}%
              </div>
              <div className="text-sm text-soft">
                {done} of {total} tasks done
              </div>
              <ProgressBar progress={progress} className="w-full" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-soft">{remaining} remaining</span>
              {overdueCount > 0 && (
                <span className="text-red font-medium">{overdueCount} overdue</span>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Needs Attention */}
      <Card className="p-6">
        <h3 className="font-display text-lg text-deep mb-4">Needs Attention</h3>
        {needsAttention.length === 0 ? (
          <p className="text-soft text-sm">Nothing urgent — you're on track!</p>
        ) : (
          <ul className="space-y-3">
            {needsAttention.map((item) => {
              const days = daysUntil(item.due_date)
              const isOverdue = days < 0
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => handleToggle(item.id)}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => handleToggle(item.id)}
                    className="mt-0.5 accent-coral shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm text-deep',
                        item.done && 'line-through text-soft'
                      )}
                    >
                      {item.task}
                    </p>
                    <p className={cn('text-xs', isOverdue ? 'text-red' : 'text-amber')}>
                      {isOverdue
                        ? `${Math.abs(days)}d overdue`
                        : days === 0
                          ? 'Due today'
                          : `${days}d left`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Lineup */}
      <Card className="p-6">
        <h3 className="font-display text-lg text-deep mb-4">Lineup</h3>
        {show.performers.length === 0 ? (
          <p className="text-soft text-sm">No performers added yet.</p>
        ) : (
          <ul className="space-y-3">
            {show.performers.map((p) => (
              <li key={p.showPerformerId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-deep truncate">{p.name}</div>
                  {p.act_type && (
                    <div className="text-xs text-soft">{p.act_type}</div>
                  )}
                </div>
                {p.set_length != null && (
                  <span className="text-xs text-soft shrink-0">{p.set_length}m</span>
                )}
                {p.call_time && (
                  <span className="text-xs text-soft shrink-0">{formatTime(p.call_time)}</span>
                )}
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Details */}
      <Card className="p-6">
        <h3 className="font-display text-lg text-deep mb-4">Details</h3>
        <dl className="space-y-2 text-sm">
          <DetailRow label="Call time" value={formatTime(show.call_time)} />
          <DetailRow label="Doors" value={formatTime(show.doors_time)} />
          <DetailRow label="Show time" value={formatTime(show.show_time)} />
          <DetailRow label="Venue" value={venue} />
          <DetailRow
            label="Tickets"
            value={
              show.tickets_sold != null
                ? `${show.tickets_sold}${show.capacity ? ` / ${show.capacity}` : ''}`
                : null
            }
          />
          <DetailRow label="Platform" value={show.ticket_platform} />
          {show.theme && <DetailRow label="Theme" value={show.theme} />}
          {show.hosts && <DetailRow label="Hosts" value={show.hosts} />}
        </dl>
      </Card>
    </div>
    </div>
  )
}
