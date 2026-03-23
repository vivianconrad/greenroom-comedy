import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Pill } from '@/components/ui/pill'
import { ShowMiniCard } from './show-mini-card'

function VenueIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-soft" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM2 6a6 6 0 1110.174 4.31l2.998 2.998a.75.75 0 01-1.06 1.06l-2.998-2.998A6 6 0 012 6z" clipRule="evenodd" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-soft" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zm-2 2a3.5 3.5 0 00-3.456 3h10.912A3.5 3.5 0 0010 10H5zM15 11.5a.5.5 0 00-.5-.5h-1v-1a.5.5 0 00-1 0v1h-1a.5.5 0 000 1h1v1a.5.5 0 001 0v-1h1a.5.5 0 00.5-.5z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0 text-soft" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8 1a5 5 0 00-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 00-5-5zm0 6.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" clipRule="evenodd" />
    </svg>
  )
}

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
              <MapPinIcon />
              {series.venue}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <UsersIcon />
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
