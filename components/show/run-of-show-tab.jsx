'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, timeToMinutes, minutesToTime, formatDate } from '@/lib/utils'
import { useCopyToClipboard } from '@/lib/hooks'
import { reorderPerformers } from '@/lib/actions/show'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

// Colors keyed by the show_performers.role column value
const ROLE_STYLES = {
  host:       { bar: 'bg-lav-bg',    badge: 'bg-lav-bg text-lav'     },
  headliner:  { bar: 'bg-coral/20',  badge: 'bg-coral/20 text-coral'  },
  opener:     { bar: 'bg-peach',     badge: 'bg-peach text-mid'       },
  performer:  { bar: 'bg-sage-bg',   badge: 'bg-sage-bg text-green'   },
  other:      { bar: 'bg-cream',     badge: 'bg-cream text-soft'      },
}

const FALLBACK_STYLES = { bar: 'bg-cream', badge: 'bg-cream text-soft' }

// Role sort priority for auto-generate (lower = earlier in show)
const ROLE_PRIORITY = { host: 0, opener: 1, performer: 2, other: 3, headliner: 4 }

function addStartTimes(slots, showTime) {
  if (!showTime) return slots.map((p) => ({ ...p, startTime: null }))
  let cursor = timeToMinutes(showTime)
  return slots.map((p) => {
    const startTime = minutesToTime(cursor)
    cursor += p.set_length ?? 0
    return { ...p, startTime }
  })
}

function buildCopyText(slots, show) {
  const header = [
    show.series?.name ?? 'Run of Show',
    show.date ? formatDate(show.date) : '',
    show.theme ? `· ${show.theme}` : '',
  ].filter(Boolean).join(' ')

  const lines = slots
    .filter((p) => !p.isVirtual)
    .map((p, i) => {
      const time = p.startTime ? `${p.startTime}  ` : ''
      const duration = p.set_length ? ` (${p.set_length}m)` : ''
      return `${i + 1}. ${time}${p.name}${duration}`
    })

  return [header, '', ...lines].join('\n')
}

export function RunOfShowTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [copied, copy] = useCopyToClipboard()

  // Local ordered list of real (non-virtual) performers
  const [order, setOrder] = useState(() =>
    [...show.performers].sort((a, b) => (a.slot_order ?? 999) - (b.slot_order ?? 999))
  )
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  // Build display slots: inject virtual host row at top if hosts set
  const hostNames = show.hosts
    ? show.hosts.split(',').map((h) => h.trim()).filter(Boolean)
    : []
  const displaySlots = addStartTimes(
    hostNames.length > 0
      ? [
          {
            showPerformerId: '__hosts__',
            name: hostNames.join(' & '),
            role: 'host',
            act_type: 'host',
            set_length: null,
            isVirtual: true,
          },
          ...order,
        ]
      : order,
    show.show_time
  )

  function move(index, direction) {
    // index is into displaySlots; adjust for the virtual host row
    const offset = hostNames.length > 0 ? 1 : 0
    const realIndex = index - offset
    if (realIndex < 0) return // can't move the virtual host row
    const newOrder = [...order]
    const target = realIndex + direction
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[realIndex], newOrder[target]] = [newOrder[target], newOrder[realIndex]]
    setOrder(newOrder)
    setDirty(true)
  }

  function handleAutoGenerate() {
    const sorted = [...show.performers].sort((a, b) => {
      const pa = ROLE_PRIORITY[a.role] ?? 2
      const pb = ROLE_PRIORITY[b.role] ?? 2
      if (pa !== pb) return pa - pb
      // within same role, stable sort by current slot_order
      return (a.slot_order ?? 999) - (b.slot_order ?? 999)
    })
    setOrder(sorted)
    setDirty(true)
  }

  function handleSave() {
    setSaving(true)
    startTransition(async () => {
      await reorderPerformers(show.id, order.map((p) => p.showPerformerId))
      setDirty(false)
      setSaving(false)
      router.refresh()
    })
  }

  if (displaySlots.length === 0) {
    return (
      <EmptyState
        title="No run of show yet"
        description="Add performers to the show, then use Auto-generate to build your running order."
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
        <p className="text-sm text-soft">
          {displaySlots.length} slot{displaySlots.length !== 1 ? 's' : ''}
          {show.show_time ? ` · starting ${minutesToTime(timeToMinutes(show.show_time))}` : ''}
        </p>
        <div className="flex gap-2 flex-wrap">
          {dirty && (
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
              Save order
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleAutoGenerate}>
            Auto-generate order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copy(buildCopyText(displaySlots, show))}
          >
            {copied ? '✓ Copied!' : 'Copy as text'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-card border border-peach divide-y divide-peach">
        {displaySlots.map((p, index) => {
          const styles = ROLE_STYLES[p.role] ?? FALLBACK_STYLES
          const offset = hostNames.length > 0 ? 1 : 0
          const realIndex = index - offset
          const isFirst = realIndex === 0
          const isLast = realIndex === order.length - 1

          return (
            <div key={p.showPerformerId} className="flex items-center gap-3 px-4 py-3">
              {/* Up/down reorder buttons (hidden for virtual host row) */}
              <div className="flex flex-col gap-0.5 shrink-0">
                {!p.isVirtual ? (
                  <>
                    <button
                      onClick={() => move(index, -1)}
                      disabled={isFirst}
                      className="text-soft/50 hover:text-mid disabled:opacity-20 leading-none text-xs px-0.5"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={isLast}
                      className="text-soft/50 hover:text-mid disabled:opacity-20 leading-none text-xs px-0.5"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </>
                ) : (
                  <span className="w-4" />
                )}
              </div>

              {/* Start time */}
              <span className="w-16 text-sm font-mono text-soft shrink-0 tabular-nums">
                {p.startTime ?? '—'}
              </span>

              {/* Role color bar */}
              <span className={cn('w-1 self-stretch rounded-full shrink-0', styles.bar)} />

              {/* Name + walk-up song */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-deep">{p.name}</div>
                {p.walk_up_song && (
                  <div className="text-xs text-soft truncate">🎵 {p.walk_up_song}</div>
                )}
              </div>

              {/* Set length */}
              {p.set_length != null && (
                <span className="text-xs text-soft shrink-0">{p.set_length}m</span>
              )}

              {/* Role badge */}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium shrink-0 capitalize',
                  styles.badge
                )}
              >
                {p.role}
              </span>
            </div>
          )
        })}
      </div>

      {!show.show_time && (
        <p className="text-xs text-soft mt-3 text-center">
          Set a show time to see calculated start times.
        </p>
      )}
      {dirty && (
        <p className="text-xs text-amber mt-3 text-center">
          You have unsaved changes to the running order.
        </p>
      )}
    </div>
  )
}
