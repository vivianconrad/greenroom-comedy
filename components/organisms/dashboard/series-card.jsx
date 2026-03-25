import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUsers, faLocationDot } from '@fortawesome/free-solid-svg-icons'
import { Card } from '@/components/atoms/card'
import { Pill } from '@/components/atoms/pill'
import { ShowMiniCard } from './show-mini-card'

export function SeriesCard({ series }) {
  const seriesHref = `/dashboard/series/${series.id}`

  // One-off series with exactly one show: link header directly to the show
  const firstShow = series.upcomingShows[0]
  const headerHref =
    series.is_one_off && firstShow
      ? `/dashboard/shows/${firstShow.id}`
      : seriesHref

  return (
    <Card className="p-0 overflow-hidden">
      {/* ── Series header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-peach">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={headerHref}
              className="font-display text-lg font-semibold text-deep hover:text-coral transition-colors line-clamp-1"
            >
              {series.name}
            </Link>

            {series.tagline && (
              <p className="text-sm font-body text-mid mt-0.5 line-clamp-1">{series.tagline}</p>
            )}

            {/* Meta pills */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {series.is_one_off ? (
                <Pill variant="neutral">One-off</Pill>
              ) : (
                series.frequency && (
                  <Pill variant="neutral">{series.frequency}</Pill>
                )
              )}
              {series.show_type && (
                <Pill variant="info">{series.show_type}</Pill>
              )}
            </div>
          </div>
        </div>

        {/* Venue + performer count */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs font-body text-soft">
          {series.venue && (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="h-3.5 w-3.5 shrink-0 text-soft" aria-hidden="true" />
              {series.venue}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUsers} className="h-3.5 w-3.5 shrink-0 text-soft" aria-hidden="true" />
            {series.performerCount === 0
              ? 'No performers'
              : `${series.performerCount} performer${series.performerCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Upcoming shows grid ── */}
      <div className="px-5 py-4">
        {series.upcomingShows.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {series.upcomingShows.map((show) => (
              <ShowMiniCard
                key={show.id}
                show={show}
                href={`/dashboard/shows/${show.id}`}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-soft font-body py-2">
            No upcoming shows.{' '}
            <Link
              href={`${seriesHref}/new-show`}
              className="text-coral hover:underline"
            >
              Add one →
            </Link>
          </p>
        )}
      </div>

      {/* ── Past shows footer ── */}
      {series.completedShowCount > 0 && (
        <div className="px-5 pb-4">
          <Link
            href={`${seriesHref}?tab=past`}
            className="text-xs font-body text-soft hover:text-mid transition-colors"
          >
            {series.completedShowCount} past show{series.completedShowCount !== 1 ? 's' : ''} →
          </Link>
        </div>
      )}
    </Card>
  )
}
