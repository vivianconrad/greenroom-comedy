'use client'

import { cn, timeToMinutes, minutesToTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

const ACT_TYPE_STYLES = {
  opening: { bar: 'bg-peach', badge: 'bg-peach text-mid' },
  host: { bar: 'bg-lav-bg', badge: 'bg-lav-bg text-lav' },
  performer: { bar: 'bg-sage-bg', badge: 'bg-sage-bg text-green' },
  headliner: { bar: 'bg-coral/20', badge: 'bg-coral/20 text-coral' },
  game: { bar: 'bg-butter', badge: 'bg-butter text-amber' },
  close: { bar: 'bg-peach', badge: 'bg-peach text-mid' },
}

function buildRunOfShow(performers, showTime) {
  if (!showTime) return performers.map((p) => ({ ...p, startTime: null }))
  let cursor = timeToMinutes(showTime)
  return performers.map((p) => {
    const startTime = minutesToTime(cursor)
    cursor += p.set_length ?? 0
    return { ...p, startTime }
  })
}

export function RunOfShowTab({ show }) {
  const ros = buildRunOfShow(show.performers, show.show_time)

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
          const styles = ACT_TYPE_STYLES[p.act_type] ?? {
            bar: 'bg-cream',
            badge: 'bg-cream text-soft',
          }

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

              {/* Act type color bar */}
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

              {/* Act type badge */}
              {p.act_type && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium shrink-0 capitalize',
                    styles.badge
                  )}
                >
                  {p.act_type}
                </span>
              )}
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
