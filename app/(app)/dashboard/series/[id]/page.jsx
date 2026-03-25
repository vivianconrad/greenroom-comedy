import { notFound, redirect } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Pill } from '@/components/ui/pill'
import { SeriesTabBar } from '@/components/series/series-tab-bar'
import { ShowsTab } from '@/components/series/shows-tab'
import { PerformersTab } from '@/components/series/performers-tab'
import { CollectionsTab } from '@/components/series/collections-tab'
import { ChecklistTemplateTab } from '@/components/series/checklist-template-tab'
import { DutyTemplatesTab } from '@/components/series/duty-templates-tab'
import { CommsTab } from '@/components/series/comms-tab'
import { InfoTab } from '@/components/series/info-tab'
import { NewShowTrigger } from '@/components/series/new-show-trigger'
import { EditSeriesTrigger } from '@/components/series/edit-series-trigger'
import { SeriesActionsMenu } from '@/components/series/series-actions-menu'
import { CopyBadge } from '@/components/ui/copy-badge'
import {
  getSeriesDetail,
  getCollectionsForSeries,
  getChecklistTemplate,
  getCommTemplates,
  getSeriesPerformers,
  getDutyTemplates,
} from '@/lib/queries/series-detail'

// ─── Frequency label helper ───────────────────────────────────────────────────

const FREQUENCY_LABELS = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  custom: 'Custom',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SeriesDetailPage({ params, searchParams }) {
  const { id } = await params
  const { tab = 'shows' } = await searchParams

  // Parallel data fetch — only load what's needed for active tab, but series
  // detail is always needed for the header. Fetch everything in parallel to
  // keep it simple; queries are fast and conditional fetching adds complexity.
  const [series, collections, checklistTasks, dutyTemplates, commTemplates, performers] =
    await Promise.all([
      getSeriesDetail(id),
      getCollectionsForSeries(id),
      getChecklistTemplate(id),
      getDutyTemplates(id),
      getCommTemplates(id),
      getSeriesPerformers(id),
    ])

  if (!series) notFound()

  // One-off series: redirect straight to the show page
  if (series.is_one_off) {
    const show = series.upcomingShows[0] ?? series.pastShows[0]
    if (show) redirect(`/dashboard/shows/${show.id}`)
  }

  const activeTab = ['shows', 'performers', 'collections', 'checklist', 'duties', 'comms', 'info'].includes(tab)
    ? tab
    : 'shows'

  const showDefaults = {
    venue: series.venue,
    call_time: series.default_call_time,
    doors_time: series.default_doors_time,
    show_time: series.default_show_time,
    default_hosts: series.default_hosts,
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* ── Breadcrumb ── */}
      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'All Shows', href: '/dashboard' },
          { label: series.name },
        ]}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-3xl font-semibold text-deep truncate">
              {series.name}
            </h1>
            {series.frequency && FREQUENCY_LABELS[series.frequency] && (
              <Pill variant="neutral">{FREQUENCY_LABELS[series.frequency]}</Pill>
            )}
          </div>

          {series.tagline && (
            <p className="mt-1 text-base font-body text-mid">{series.tagline}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm font-body text-soft">
            {series.venue && (
              <span>{series.venue}</span>
            )}
            {series.performerCount > 0 && (
              <span>
                <span className="font-semibold text-deep">{series.performerCount}</span>{' '}
                {series.performerCount === 1 ? 'performer' : 'performers'}
              </span>
            )}
          </div>

          {(series.ticket_url || series.promo_code) && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {series.ticket_url && (
                <a
                  href={series.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-coral text-white text-sm font-body font-medium hover:bg-coral/90 transition-colors"
                >
                  Tickets ↗
                </a>
              )}
              {series.promo_code && (
                <CopyBadge label="Promo:" value={series.promo_code} />
              )}
            </div>
          )}

          {series.description_long && (
            <details className="mt-3 group">
              <summary className="text-xs font-body text-soft cursor-pointer hover:text-mid select-none list-none flex items-center gap-1">
                <span className="group-open:hidden">About ▸</span>
                <span className="hidden group-open:inline">About ▾</span>
              </summary>
              <p className="mt-2 text-sm font-body text-mid whitespace-pre-line">{series.description_long}</p>
            </details>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <EditSeriesTrigger series={series} />
          <NewShowTrigger seriesId={id} defaults={showDefaults} />
          <SeriesActionsMenu
            seriesId={id}
            seriesName={series.name}
            showCount={series.upcomingShows.length + series.pastShows.length}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <SeriesTabBar activeTab={activeTab} />

      {/* ── Tab content ── */}
      {activeTab === 'shows' && (
        <ShowsTab series={series} seriesId={id} />
      )}
      {activeTab === 'performers' && (
        <PerformersTab performers={performers} seriesId={id} />
      )}
      {activeTab === 'collections' && (
        <CollectionsTab collections={collections} seriesId={id} />
      )}
      {activeTab === 'checklist' && (
        <ChecklistTemplateTab tasks={checklistTasks} seriesId={id} commTemplates={commTemplates} />
      )}
      {activeTab === 'duties' && (
        <DutyTemplatesTab templates={dutyTemplates} seriesId={id} />
      )}
      {activeTab === 'comms' && (
        <CommsTab templates={commTemplates} seriesId={id} />
      )}
      {activeTab === 'info' && (
        <InfoTab series={series} seriesId={id} />
      )}
    </div>
  )
}
