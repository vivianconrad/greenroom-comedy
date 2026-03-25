'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatShortDate } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import { restoreShow } from '@/lib/actions/show'
import { restoreSeries } from '@/lib/actions/series'

function DaysRemaining({ days }) {
  const urgent = days <= 7
  return (
    <span
      className={cn(
        'text-xs font-body',
        urgent ? 'text-red font-medium' : 'text-soft'
      )}
    >
      {days === 0 ? 'Expires today' : `${days}d left`}
    </span>
  )
}

function TrashRow({ label, sublabel, daysRemaining, onRestore, isPending }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-peach last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body text-deep truncate">{label}</p>
        {sublabel && (
          <p className="text-xs font-body text-soft truncate">{sublabel}</p>
        )}
      </div>
      <DaysRemaining days={daysRemaining} />
      <Button
        variant="secondary"
        size="sm"
        onClick={onRestore}
        loading={isPending}
      >
        Restore
      </Button>
    </div>
  )
}

export function TrashList({ deletedSeries, deletedShows }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // Track which item is being restored by id
  const [restoringId, setRestoringId] = useState(null)

  function handleRestoreSeries(seriesId) {
    setRestoringId(seriesId)
    startTransition(async () => {
      const result = await restoreSeries(seriesId)
      setRestoringId(null)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  function handleRestoreShow(showId) {
    setRestoringId(showId)
    startTransition(async () => {
      const result = await restoreShow(showId)
      setRestoringId(null)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      {deletedSeries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-2">
            Series
          </h2>
          <div className="rounded-xl border border-peach bg-white px-4">
            {deletedSeries.map((s) => (
              <TrashRow
                key={s.id}
                label={s.name}
                sublabel={
                  s.showCount > 0
                    ? `${s.showCount} show${s.showCount === 1 ? '' : 's'} will also be restored`
                    : null
                }
                daysRemaining={s.daysRemaining}
                onRestore={() => handleRestoreSeries(s.id)}
                isPending={restoringId === s.id}
              />
            ))}
          </div>
        </section>
      )}

      {deletedShows.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-2">
            Shows
          </h2>
          <div className="rounded-xl border border-peach bg-white px-4">
            {deletedShows.map((s) => (
              <TrashRow
                key={s.id}
                label={[s.seriesName, s.date ? formatShortDate(s.date) : null, s.theme]
                  .filter(Boolean)
                  .join(' · ')}
                daysRemaining={s.daysRemaining}
                onRestore={() => handleRestoreShow(s.id)}
                isPending={restoringId === s.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
