import Link from 'next/link'
import { Pill } from '@/components/ui/pill'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatShortDate, daysUntil } from '@/lib/utils'

function DaysAwayPill({ date }) {
  const days = daysUntil(date)

  if (days <= 0) {
    return <Pill variant="danger">{days === 0 ? 'Today' : `${Math.abs(days)}d ago`}</Pill>
  }
  if (days <= 7) {
    return <Pill variant="warning">{days}d away</Pill>
  }
  return <Pill variant="info">Planning</Pill>
}

function StatItem({ label, value, danger = false }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className={danger ? 'text-red font-semibold' : 'text-deep font-semibold'}>
        {value}
      </span>
      <span className="text-soft">{label}</span>
    </span>
  )
}

export function ShowMiniCard({ show, href }) {
  return (
    <Link
      href={href}
      className="block group rounded-card border border-peach bg-cream hover:border-coral/40 hover:bg-white transition-colors p-4"
    >
      {/* Date + days-away pill */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-soft font-body uppercase tracking-wide">
            {show.date ? formatShortDate(show.date) : 'No date'}
          </p>
          {show.title && (
            <p className="mt-0.5 text-sm font-medium text-deep font-body truncate">
              {show.title}
            </p>
          )}
        </div>
        {show.date && <DaysAwayPill date={show.date} />}
      </div>

      {/* Progress bar */}
      <ProgressBar value={show.progress} className="mb-3" />

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs font-body flex-wrap">
        <StatItem value={`${show.progress}%`} label="done" />

        {show.totalPerformers > 0 && (
          <StatItem
            value={`${show.confirmedPerformers}/${show.totalPerformers}`}
            label="confirmed"
          />
        )}

        {show.overdueCount > 0 && (
          <StatItem value={show.overdueCount} label="overdue" danger />
        )}
      </div>
    </Link>
  )
}
