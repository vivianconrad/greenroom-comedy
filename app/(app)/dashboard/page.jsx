import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDashboardData } from '@/lib/queries/dashboard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { StatBadge } from '@/components/ui/stat-badge'
import { SeriesCard } from '@/components/dashboard/series-card'
import { NewSeriesTrigger } from '@/components/dashboard/new-series-trigger'

export const metadata = {
  title: 'All Shows — Greenroom',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { series, totalUpcoming, totalPerformers } =
    await getDashboardData(user.id)

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-deep">
            All Shows
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <StatBadge value={series.length} label={series.length === 1 ? 'series' : 'series'} />
            <StatBadge value={totalUpcoming} label={totalUpcoming === 1 ? 'upcoming show' : 'upcoming shows'} />
            <StatBadge value={totalPerformers} label={totalPerformers === 1 ? 'performer' : 'performers'} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Performer Database — link styled as secondary button */}
          <Link
            href="/dashboard/performers"
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium font-body rounded-lg
              bg-transparent text-deep border border-mid hover:bg-peach transition-colors"
          >
            Performer Database
          </Link>
          {/* New Series — client component owns the modal */}
          <NewSeriesTrigger />
        </div>
      </div>

      {/* ── Content ── */}
      {series.length === 0 ? (
        <EmptyState
          icon="🎭"
          title="No shows yet"
          description="Create your first series to start planning shows, tracking tasks, and booking performers."
          action={<NewSeriesTrigger />}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  )
}
