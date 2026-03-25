'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { formatDate, formatShortDate, daysUntil } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Pill } from '@/components/ui/pill'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

function DaysAwayPill({ date }) {
  const days = daysUntil(date)
  if (days < 0) return <Pill variant="neutral">{Math.abs(days)}d ago</Pill>
  if (days === 0) return <Pill variant="danger">Today</Pill>
  if (days <= 7) return <Pill variant="warning">{days}d away</Pill>
  if (days <= 30) return <Pill variant="info">{days}d away</Pill>
  return <Pill variant="neutral">Planning</Pill>
}

// ─── Next show hero card ───────────────────────────────────────────────────────

function NextShowCard({ show, seriesVenue }) {
  const venue = show.venue ?? seriesVenue
  const times = [
    show.call_time && { label: 'Call', value: formatTime(show.call_time) },
    show.doors_time && { label: 'Doors', value: formatTime(show.doors_time) },
    show.show_time && { label: 'Show', value: formatTime(show.show_time) },
  ].filter(Boolean)

  return (
    <Link
      href={`/dashboard/shows/${show.id}`}
      className="block group rounded-card border border-peach bg-white hover:border-coral/40 transition-colors p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-soft font-body mb-1">Next show</p>
          <p className="text-xl font-semibold text-deep font-display">
            {show.date ? formatDate(show.date) : 'No date set'}
          </p>
          {venue && <p className="text-sm text-soft font-body mt-0.5">{venue}</p>}
          {show.theme && <p className="text-sm text-soft font-body italic mt-0.5">"{show.theme}"</p>}
        </div>
        {show.date && <DaysAwayPill date={show.date} />}
      </div>

      {times.length > 0 && (
        <div className="flex items-center gap-3 text-xs font-body text-soft mt-2">
          {times.map(({ label, value }) => (
            <span key={label}>
              <span className="text-soft/70">{label} </span>
              <span className="text-mid">{value}</span>
            </span>
          ))}
        </div>
      )}

      <ProgressBar value={show.progress} className="mt-4 mb-2" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs font-body flex-wrap">
          <span>
            <span className="font-semibold text-deep">{show.progress}%</span>
            <span className="text-soft"> checklist done</span>
          </span>
          {show.totalPerformers > 0 && (
            <span>
              <span className="font-semibold text-deep">
                {show.confirmedPerformers}/{show.totalPerformers}
              </span>
              <span className="text-soft"> performers confirmed</span>
            </span>
          )}
          {show.tickets_sold != null && (
            <span>
              <span className="font-semibold text-deep">{show.tickets_sold}</span>
              {show.capacity && <span className="text-soft">/{show.capacity}</span>}
              <span className="text-soft"> tickets</span>
            </span>
          )}
        </div>
        <span className="text-xs text-coral font-body group-hover:underline shrink-0 ml-3">
          Open show →
        </span>
      </div>
    </Link>
  )
}

// ─── Upcoming shows list (for when there are multiple) ────────────────────────

function UpcomingShowRow({ show }) {
  const days = daysUntil(show.date)
  return (
    <Link
      href={`/dashboard/shows/${show.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-cream/60 transition-colors group"
    >
      <span className="text-sm font-body text-mid w-28 shrink-0">
        {show.date ? formatShortDate(show.date) : '—'}
      </span>
      <span className="flex-1 min-w-0 flex items-center gap-2">
        {show.theme && (
          <span className="text-sm text-soft font-body italic truncate">"{show.theme}"</span>
        )}
      </span>
      <div className="flex items-center gap-3 shrink-0 text-xs font-body text-soft">
        {show.totalPerformers > 0 && <span>{show.totalPerformers} performers</span>}
        {show.progress > 0 && <span>{show.progress}%</span>}
        {days >= 0 && days <= 30 && (
          <span className={cn('font-medium', days <= 7 ? 'text-amber-500' : 'text-soft')}>
            {days === 0 ? 'Today' : `${days}d`}
          </span>
        )}
      </div>
      <span className="text-xs text-soft group-hover:text-coral transition-colors shrink-0">→</span>
    </Link>
  )
}

// ─── Past show row ────────────────────────────────────────────────────────────

function PastShowRow({ show }) {
  return (
    <Link
      href={`/dashboard/shows/${show.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-cream/60 transition-colors group"
    >
      <span className="text-sm font-body text-soft/70 w-28 shrink-0">
        {show.date ? formatShortDate(show.date) : '—'}
      </span>
      <span className="flex-1 min-w-0">
        {show.theme && (
          <span className="text-sm text-soft font-body italic truncate">"{show.theme}"</span>
        )}
      </span>
      <div className="flex items-center gap-3 shrink-0 text-xs font-body text-soft">
        {show.totalPerformers > 0 && <span>{show.totalPerformers} performers</span>}
        {show.tickets_sold != null && <span>{show.tickets_sold} tickets</span>}
      </div>
      <span className="text-xs text-soft group-hover:text-coral transition-colors shrink-0">→</span>
    </Link>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, href, onClick }) {
  const cls = 'flex flex-col items-center justify-center rounded-card border border-peach bg-white py-4 px-3 gap-0.5 transition-colors hover:border-coral/40'
  const inner = (
    <>
      <span className="text-2xl font-semibold font-display text-deep">{value}</span>
      <span className="text-xs text-soft font-body text-center">{label}</span>
    </>
  )
  if (href) return <Link href={href} className={cls}>{inner}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={cn(cls, 'w-full cursor-pointer')}>{inner}</button>
  return <div className={cls}>{inner}</div>
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SeriesOverviewTab({ series, seriesId }) {
  const pathname = usePathname()
  const router = useRouter()

  const nextShow = series.upcomingShows[0] ?? null
  const moreUpcoming = series.upcomingShows.slice(1)
  const recentPast = series.pastShows.slice(0, 5)
  const totalShows = series.upcomingShows.length + series.pastShows.length

  function goToTab(tab) {
    router.push(`${pathname}?tab=${tab}`)
  }

  return (
    <div className="pt-6 space-y-8 max-w-2xl">

      {/* ── Next show ── */}
      {nextShow ? (
        <NextShowCard show={nextShow} seriesVenue={series.venue} />
      ) : (
        <div className="rounded-card border border-dashed border-peach px-6 py-8 text-center">
          <p className="text-sm text-soft font-body">No upcoming shows scheduled.</p>
          <p className="text-xs text-soft/70 font-body mt-1">Use the + Add show button to schedule the next one.</p>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          value={totalShows}
          label={totalShows === 1 ? 'show' : 'shows total'}
          onClick={() => goToTab('shows')}
        />
        <StatCard
          value={series.upcomingShows.length}
          label={series.upcomingShows.length === 1 ? 'upcoming' : 'upcoming'}
          onClick={() => goToTab('shows')}
        />
        <StatCard
          value={series.performerCount}
          label={series.performerCount === 1 ? 'performer' : 'performers'}
          onClick={() => goToTab('performers')}
        />
      </div>

      {/* ── More upcoming shows ── */}
      {moreUpcoming.length > 0 && (
        <section>
          <h3 className="font-display text-base text-deep mb-2">Also coming up</h3>
          <div className="rounded-card border border-peach bg-white divide-y divide-peach">
            {moreUpcoming.map((show) => (
              <UpcomingShowRow key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recent past shows ── */}
      {recentPast.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base text-deep">Recent shows</h3>
            {series.pastShows.length > 5 && (
              <button
                type="button"
                onClick={() => goToTab('shows')}
                className="text-xs text-soft hover:text-coral font-body transition-colors"
              >
                See all {series.pastShows.length} →
              </button>
            )}
          </div>
          <div className="rounded-card border border-peach bg-white divide-y divide-peach">
            {recentPast.map((show) => (
              <PastShowRow key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
