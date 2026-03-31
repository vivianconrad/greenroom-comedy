'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMasksTheater } from '@fortawesome/free-solid-svg-icons'
import { Pill } from '@/components/atoms/pill'
import { ProgressBar } from '@/components/atoms/progress-bar'
import { EmptyState } from '@/components/atoms/empty-state'
import { Button } from '@/components/atoms/button'
import { ConfirmDialog } from '@/components/atoms/confirm-dialog'
import { formatDate, formatShortDate, daysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { bulkDeleteShows } from '@/lib/actions/show'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function TimeRow({ callTime, doorsTime, showTime }) {
  const times = [
    callTime && { label: 'Call', value: formatTime(callTime) },
    doorsTime && { label: 'Doors', value: formatTime(doorsTime) },
    showTime && { label: 'Show', value: formatTime(showTime) },
  ].filter(Boolean)

  if (!times.length) return null

  return (
    <div className="flex items-center gap-3 text-xs font-body text-soft mt-1">
      {times.map(({ label, value }) => (
        <span key={label}>
          <span className="text-soft/70">{label} </span>
          <span className="text-mid">{value}</span>
        </span>
      ))}
    </div>
  )
}

function DaysAwayPill({ date }) {
  const days = daysUntil(date)
  if (days < 0) return <Pill variant="neutral">{Math.abs(days)}d ago</Pill>
  if (days === 0) return <Pill variant="danger">Today</Pill>
  if (days <= 7) return <Pill variant="warning">{days}d away</Pill>
  return <Pill variant="info">Planning</Pill>
}

// ─── Upcoming show card ───────────────────────────────────────────────────────

function UpcomingShowCard({ show, seriesVenue }) {
  const venue = show.venue ?? seriesVenue
  return (
    <Link
      href={`/dashboard/shows/${show.id}`}
      className="block group rounded-card border border-peach bg-white hover:border-coral/40 transition-colors p-4"
    >
      {/* Date + pill */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <p className="text-base font-semibold text-deep font-display">
            {show.date ? formatDate(show.date) : 'No date set'}
          </p>
          {venue && (
            <p className="text-xs text-soft font-body mt-0.5 truncate">{venue}</p>
          )}
        </div>
        {show.date && <DaysAwayPill date={show.date} />}
      </div>

      <TimeRow
        callTime={show.call_time}
        doorsTime={show.doors_time}
        showTime={show.show_time}
      />

      {show.theme && (
        <p className="mt-2 text-xs text-soft font-body italic">"{show.theme}"</p>
      )}

      {/* Progress */}
      <ProgressBar value={show.progress} className="mt-3 mb-2" />

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs font-body flex-wrap">
        <span>
          <span className="font-semibold text-deep">{show.progress}%</span>
          <span className="text-soft"> done</span>
        </span>
        {show.totalPerformers > 0 && (
          <span>
            <span className="font-semibold text-deep">
              {show.confirmedPerformers}/{show.totalPerformers}
            </span>
            <span className="text-soft"> confirmed</span>
          </span>
        )}
        {show.tickets_sold != null && (
          <span>
            <span className="font-semibold text-deep">{show.tickets_sold}</span>
            <span className="text-soft"> tickets</span>
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Past show row ────────────────────────────────────────────────────────────

function PastShowRow({ show, selectMode, selected, onToggle }) {
  const rowContent = (
    <>
      <span className="text-sm font-body text-mid shrink-0 w-24">
        {show.date ? formatShortDate(show.date) : '—'}
      </span>

      <span className="flex-1 min-w-0 flex items-center gap-2">
        {show.theme && (
          <Pill variant="neutral" className="truncate max-w-[180px]">
            {show.theme}
          </Pill>
        )}
      </span>

      <div className="flex items-center gap-3 shrink-0 text-xs font-body text-soft">
        {show.totalPerformers > 0 && (
          <span>{show.totalPerformers} performers</span>
        )}
        {show.tickets_sold != null && (
          <span>{show.tickets_sold} tickets</span>
        )}
        <Pill variant="success">Done</Pill>
      </div>
    </>
  )

  if (selectMode) {
    return (
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-peach transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="accent-coral shrink-0"
        />
        {rowContent}
      </div>
    )
  }

  return (
    <Link
      href={`/dashboard/shows/${show.id}`}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-peach transition-colors group"
    >
      {rowContent}
    </Link>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function ShowsTab({ series, seriesId }) {
  const { upcomingShows, pastShows, venue } = series
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)

  const hasAny = upcomingShows.length > 0 || pastShows.length > 0

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (selectedIds.size === pastShows.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pastShows.map((s) => s.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const result = await bulkDeleteShows([...selectedIds])
      if (result?.error) { alert(result.error); return }
      setConfirmOpen(false)
      exitSelectMode()
      router.refresh()
    })
  }

  if (!hasAny) {
    return (
      <EmptyState
        icon={<FontAwesomeIcon icon={faMasksTheater} className="h-8 w-8 text-soft/40" />}
        title="No shows yet"
        description="Add the first show to start planning."
        className="py-20"
      />
    )
  }

  return (
    <div className="flex flex-col gap-8 pt-6">
      {upcomingShows.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-3">
            Upcoming
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingShows.map((show) => (
              <UpcomingShowCard key={show.id} show={show} seriesVenue={venue} />
            ))}
          </div>
        </section>
      )}

      {pastShows.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">
              Past Shows
            </h2>
            {!selectMode ? (
              <button
                onClick={() => setSelectMode(true)}
                className="text-xs font-body text-soft hover:text-mid transition-colors"
              >
                Select
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-body text-soft hover:text-mid transition-colors"
                >
                  {selectedIds.size === pastShows.length ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  onClick={exitSelectMode}
                  className="text-xs font-body text-soft hover:text-mid transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="rounded-card border border-peach bg-white divide-y divide-peach">
            {pastShows.map((show) => (
              <PastShowRow
                key={show.id}
                show={show}
                selectMode={selectMode}
                selected={selectedIds.has(show.id)}
                onToggle={() => toggleSelect(show.id)}
              />
            ))}
          </div>

          {selectMode && selectedIds.size > 0 && (
            <div className="mt-3 flex items-center justify-end gap-3">
              <span className="text-sm font-body text-soft">{selectedIds.size} selected</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmOpen(true)}
              >
                Move {selectedIds.size} to trash
              </Button>
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Move ${selectedIds.size} show${selectedIds.size !== 1 ? 's' : ''} to trash?`}
        description="These shows will be moved to the trash and hidden from your dashboard."
        warning="You have 30 days to restore them before they're permanently deleted."
        confirmLabel="Move to trash"
        isPending={isPending}
      />
    </div>
  )
}
