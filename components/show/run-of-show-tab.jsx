'use client'

import { cn, timeToMinutes, minutesToTime } from '@/lib/utils'
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

function buildRunOfShow(performers, showTime, hostsStr) {
  // Inject virtual host opening slot if hosts are set
  const hostNames = hostsStr ? hostsStr.split(',').map((h) => h.trim()).filter(Boolean) : []
  const slots = hostNames.length > 0
    ? [
        {
          showPerformerId: '__hosts__',
          name: hostNames.join(' & '),
          role: 'host',
          act_type: 'host',
          set_length: null,
          isVirtual: true,
        },
        ...performers,
      ]
    : performers

  if (!showTime) return slots.map((p) => ({ ...p, startTime: null }))
  let cursor = timeToMinutes(showTime)
  return slots.map((p) => {
    const startTime = minutesToTime(cursor)
    cursor += p.set_length ?? 0
    return { ...p, startTime }
  })
}

export function RunOfShowTab({ show }) {
  const ros = buildRunOfShow(show.performers, show.show_time, show.hosts)

  if (ros.length === 0) {
    return (
      <EmptyState
        title="No run of show yet"
        description="Add performers to the show and assign slot positions to build your running order."
        action={
          <Button variant="secondary" size="sm" onClick={() => alert('Add slot coming soon')}>
            + Add slot
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-soft">
          {ros.length} slot{ros.length !== 1 ? 's' : ''}
          {show.show_time ? ` · starting ${minutesToTime(timeToMinutes(show.show_time))}` : ''}
        </p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => alert('Auto-generate coming soon')}
          >
            Auto-generate from lineup
          </Button>
          <Button variant="secondary" size="sm" onClick={() => alert('Add slot coming soon')}>
            + Add slot
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-card border border-peach divide-y divide-peach">
        {ros.map((p) => {
          const styles = ROLE_STYLES[p.role] ?? FALLBACK_STYLES

          return (
            <div key={p.showPerformerId} className="flex items-center gap-3 px-4 py-3">
              {/* Drag handle — visual only */}
              <span
                className="text-soft/30 cursor-grab select-none text-lg shrink-0"
                title="Drag to reorder (coming soon)"
              >
                ⠿
              </span>

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
          Set a show time on this show to see calculated start times.
        </p>
      )}
    </div>
  )
}
