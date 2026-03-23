import { createClient } from '@/lib/supabase/server'

/**
 * Returns all series owned by the user with their non-completed shows,
 * ordered so the series with the soonest upcoming show comes first.
 *
 * Assumes schema:
 *   series  (id, owner_id, name, is_one_off, created_at)
 *   shows   (id, series_id, date, status, created_at)
 *
 * "status" values: 'draft' | 'active' | 'completed'
 */
export async function getSeriesWithShows(userId, { page = 0, pageSize = 50 } = {}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(
      `
      id,
      name,
      is_one_off,
      shows (
        id,
        date,
        status
      )
    `
    )
    .eq('owner_id', userId)
    .neq('shows.status', 'completed')
    .order('created_at', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    console.error('getSeriesWithShows error:', error.message)
    return []
  }

  // Sort each series' shows by date ascending, then sort series by their
  // earliest upcoming show date so the most imminent series appears first.
  const withSortedShows = (data ?? []).map((series) => ({
    ...series,
    shows: (series.shows ?? []).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    ),
  }))

  withSortedShows.sort((a, b) => {
    const aDate = a.shows[0]?.date ? new Date(a.shows[0].date) : Infinity
    const bDate = b.shows[0]?.date ? new Date(b.shows[0].date) : Infinity
    return aDate - bDate
  })

  return withSortedShows
}

/**
 * Returns a single series with ALL its shows (all statuses), ordered by date.
 */
export async function getSeriesById(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(
      `
      id,
      name,
      is_one_off,
      owner_id,
      shows (
        id,
        date,
        status
      )
    `
    )
    .eq('id', seriesId)
    .single()

  if (error) {
    console.error('getSeriesById error:', error.message)
    return null
  }

  return {
    ...data,
    shows: (data.shows ?? []).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    ),
  }
}
