'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatShortDate } from '@/lib/utils'
import { Button } from '@/components/atoms/button'
import { ConfirmDialog } from '@/components/atoms/confirm-dialog'
import { restoreShow, permanentlyDeleteShow } from '@/lib/actions/show'
import { restoreSeries, permanentlyDeleteSeries } from '@/lib/actions/series'

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

function TrashRow({ label, sublabel, daysRemaining, onRestore, onDelete, isPendingRestore, isPendingDelete }) {
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
        loading={isPendingRestore}
        disabled={isPendingDelete}
      >
        Restore
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={onDelete}
        loading={isPendingDelete}
        disabled={isPendingRestore}
      >
        Delete
      </Button>
    </div>
  )
}

export function TrashList({ deletedSeries, deletedShows }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [restoringId, setRestoringId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null) // { id, type, label }

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

  function handleConfirmDelete() {
    if (!confirmTarget) return
    const { id, type } = confirmTarget
    setConfirmTarget(null)
    setDeletingId(id)
    startTransition(async () => {
      const result = type === 'series'
        ? await permanentlyDeleteSeries(id)
        : await permanentlyDeleteShow(id)
      setDeletingId(null)
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  const confirmIsSeries = confirmTarget?.type === 'series'

  return (
    <>
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Permanently delete ${confirmIsSeries ? 'series' : 'show'}?`}
        description={`"${confirmTarget?.label}" will be permanently deleted and cannot be recovered.`}
        warning={confirmIsSeries ? 'All shows in this series will also be permanently deleted.' : undefined}
        confirmLabel="Delete forever"
        isPending={!!deletingId}
      />

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
                  onDelete={() => setConfirmTarget({ id: s.id, type: 'series', label: s.name })}
                  isPendingRestore={restoringId === s.id}
                  isPendingDelete={deletingId === s.id}
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
              {deletedShows.map((s) => {
                const showLabel = [s.seriesName, s.date ? formatShortDate(s.date) : null, s.theme]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <TrashRow
                    key={s.id}
                    label={showLabel}
                    daysRemaining={s.daysRemaining}
                    onRestore={() => handleRestoreShow(s.id)}
                    onDelete={() => setConfirmTarget({ id: s.id, type: 'show', label: showLabel })}
                    isPendingRestore={restoringId === s.id}
                    isPendingDelete={deletingId === s.id}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
