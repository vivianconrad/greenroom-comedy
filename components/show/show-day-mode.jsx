'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDate, timeToMinutes, minutesToTime } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/show'
import { Button } from '@/components/ui/button'

function buildRunOfShow(performers, showTime) {
  if (!showTime) return performers.map((p) => ({ ...p, startTime: null }))
  let cursor = timeToMinutes(showTime)
  return performers.map((p) => {
    const startTime = minutesToTime(cursor)
    cursor += p.set_length ?? 0
    return { ...p, startTime }
  })
}

export function ShowDayMode({ show, onExit }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const ros = buildRunOfShow(show.performers, show.show_time)
  const showDayTasks = (show.checklistItems ?? []).filter(
    (i) => i.stage === 'day' && i.is_active !== false
  )

  function handleToggle(itemId) {
    startTransition(async () => {
      await toggleChecklistItem(itemId)
      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-deep text-cream">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-deep/95 backdrop-blur border-b border-mid/30 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="font-display text-xl text-cream">{show.series?.name}</h1>
          <p className="text-soft text-sm">{formatDate(show.date)}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onExit}
          className="border-mid/40 text-cream hover:bg-mid/20"
        >
          Exit Show Day Mode
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-12">
        {/* Running order */}
        <section>
          <h2 className="font-display text-2xl text-cream mb-6">Running Order</h2>
          {ros.length === 0 ? (
            <p className="text-soft">No run of show configured.</p>
          ) : (
            <div>
              {ros.map((p) => (
                <div
                  key={p.showPerformerId}
                  className="flex items-center gap-5 py-5 border-b border-mid/20 last:border-0"
                >
                  <div className="w-24 shrink-0">
                    <span className="text-3xl font-mono font-bold text-cream/90 tabular-nums">
                      {p.startTime ?? '—'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xl font-medium text-cream">{p.name}</div>
                    {p.walk_up_song && (
                      <div className="text-soft text-sm mt-1">🎵 {p.walk_up_song}</div>
                    )}
                  </div>
                  {p.set_length != null && (
                    <div className="text-soft text-lg shrink-0">{p.set_length}m</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Show-day checklist */}
        <section>
          <h2 className="font-display text-2xl text-cream mb-6">Show-Day Tasks</h2>
          {showDayTasks.length === 0 ? (
            <p className="text-soft">
              No show-day tasks. Add tasks with stage "Show Day" in the checklist.
            </p>
          ) : (
            <div>
              {showDayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-5 py-5 border-b border-mid/20 last:border-0 cursor-pointer group"
                  onClick={() => handleToggle(task.id)}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                      task.done
                        ? 'bg-sage border-sage'
                        : 'border-mid/50 group-hover:border-soft'
                    )}
                  >
                    {task.done && (
                      <span className="text-white text-sm font-bold">✓</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xl transition-colors',
                      task.done ? 'line-through text-soft' : 'text-cream'
                    )}
                  >
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
