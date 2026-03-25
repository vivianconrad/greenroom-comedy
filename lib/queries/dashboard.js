import { createClient } from '@/lib/supabase/server'

/**
 * Fetches everything the dashboard page needs in a single Supabase query,
 * then shapes the data in JS so the page component stays simple.
 *
 * Assumed schema:
 *   series          (id, owner_id, name, is_one_off, frequency, show_type, venue, tagline)
 *   shows           (id, series_id, date, status)
 *   checklist_items (id, show_id, done, due_date)
 *   show_performers (id, show_id, performer_id)
 *   performer_series(id, series_id, performer_id)
 *
 * Returns:
 * {
 *   series: SeriesWithStats[],   // sorted: soonest upcoming show first
 *   totalUpcoming: number,
 *   totalPerformers: number,     // unique across all series
 * }
 */
export async function getDashboardData(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(
      `
      id,
      name,
      is_one_off,
      frequency,
      show_type,
      venue,
      tagline,
      performer_series ( performer_id ),
      shows (
        id,
        date,
        status,
        checklist_items ( id, done, due_date ),
        show_performers ( id, performer_id )
      )
    `
    )
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .is('shows.deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getDashboardData error:', error.message)
    return { series: [], totalUpcoming: 0, totalPerformers: 0 }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const series = (data ?? []).map((s) => {
    const allShows = s.shows ?? []
    const upcomingShows = allShows
      .filter((show) => show.status !== 'completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((show) => {
        const items = show.checklist_items ?? []
        const checklistTotal = items.length
        const checklistDone = items.filter((i) => i.done).length
        const overdueCount = items.filter(
          (i) => !i.done && i.due_date && new Date(i.due_date) < today
        ).length
        const progress =
          checklistTotal > 0
            ? Math.round((checklistDone / checklistTotal) * 100)
            : 0

        const performers = show.show_performers ?? []
        const confirmedPerformers = performers.length
        const totalPerformers = performers.length

        return {
          id: show.id,
          date: show.date,
          status: show.status,
          checklistTotal,
          checklistDone,
          progress,
          overdueCount,
          confirmedPerformers,
          totalPerformers,
        }
      })

    const completedShowCount = allShows.filter(
      (show) => show.status === 'completed'
    ).length
    const performerCount = (s.performer_series ?? []).length

    return {
      id: s.id,
      name: s.name,
      is_one_off: s.is_one_off,
      frequency: s.frequency,
      show_type: s.show_type,
      venue: s.venue,
      tagline: s.tagline,
      performerCount,
      completedShowCount,
      upcomingShows,
    }
  })

  // Sort series so the one with the soonest upcoming show appears first
  series.sort((a, b) => {
    const aDate = a.upcomingShows[0]?.date
      ? new Date(a.upcomingShows[0].date)
      : Infinity
    const bDate = b.upcomingShows[0]?.date
      ? new Date(b.upcomingShows[0].date)
      : Infinity
    return aDate - bDate
  })

  const totalUpcoming = series.reduce(
    (sum, s) => sum + s.upcomingShows.length,
    0
  )

  // Unique performers across all series
  const allPerformerIds = new Set(
    (data ?? []).flatMap((s) =>
      (s.performer_series ?? []).map((p) => p.performer_id)
    )
  )
  const totalPerformers = allPerformerIds.size

  return { series, totalUpcoming, totalPerformers }
}
