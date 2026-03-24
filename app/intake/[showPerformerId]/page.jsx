import { notFound } from 'next/navigation'
import { getIntakeData } from '@/lib/queries/intake'
import { formatDate, formatTime } from '@/lib/utils'
import { IntakeForm } from './IntakeForm'

export const metadata = {
  title: 'Performer Info — Greenroom',
}

export default async function IntakePage({ params }) {
  const { showPerformerId } = await params
  const intake = await getIntakeData(showPerformerId)

  if (!intake || !intake.performer) notFound()

  const { performer, show } = intake

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-soft font-body mb-1">
            {show?.seriesName ?? 'Performer info'}
          </p>
          <h1 className="font-display text-3xl text-deep mb-1">
            Hey, {performer.name}!
          </h1>
          {show && (
            <p className="text-soft font-body text-sm">
              {formatDate(show.date)}
              {show.theme && ` · ${show.theme}`}
              {show.venue && ` · ${show.venue}`}
            </p>
          )}
          {show?.call_time && (
            <p className="text-soft font-body text-sm mt-0.5">
              Call time: {formatTime(show.call_time)}
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-card-lg border border-peach p-6 shadow-sm">
          <p className="text-sm font-body text-mid mb-6">
            Fill this in so we can get your bio ready, sort your walk-up music, and know how to
            handle promos. It only takes a minute!
          </p>
          <IntakeForm intake={intake} />
        </div>

        <p className="text-center text-xs text-soft font-body mt-6">
          Powered by Greenroom
        </p>
      </div>
    </div>
  )
}
