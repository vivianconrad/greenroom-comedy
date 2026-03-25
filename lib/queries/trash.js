import { createClient } from '@/lib/supabase/server'

/**
 * Returns all soft-deleted series and standalone shows (shows whose series
 * is NOT also soft-deleted) for the current user, sorted by most recently
 * deleted first.
 *
 * Each item has a `daysRemaining` field so the UI can warn when the 30-day
 * window is closing.
 */
export async function getDeletedItems(userId) {
  const supabase = await createClient()

  const [seriesResult, showsResult] = await Promise.all([
    supabase
      .from('series')
      .select('id, name, is_one_off, deleted_at, shows ( id )')
      .eq('owner_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),

    supabase
      .from('shows')
      .select('id, date, theme, deleted_at, series ( id, name, owner_id, deleted_at )')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
  ])

  if (seriesResult.error) console.error('getDeletedItems series error:', seriesResult.error.message)
  if (showsResult.error) console.error('getDeletedItems shows error:', showsResult.error.message)

  const now = Date.now()
  const MS_PER_DAY = 86_400_000

  function daysRemaining(deletedAt) {
    const expiresAt = new Date(deletedAt).getTime() + 30 * MS_PER_DAY
    return Math.max(0, Math.ceil((expiresAt - now) / MS_PER_DAY))
  }

  const deletedSeries = (seriesResult.data ?? []).map((s) => ({
    type: 'series',
    id: s.id,
    name: s.name,
    is_one_off: s.is_one_off,
    showCount: (s.shows ?? []).length,
    deletedAt: s.deleted_at,
    daysRemaining: daysRemaining(s.deleted_at),
  }))

  // Only include shows whose series is NOT also soft-deleted (those are
  // covered by the series entry above).
  const deletedShows = (showsResult.data ?? [])
    .filter((s) => s.series?.owner_id === userId && !s.series?.deleted_at)
    .map((s) => ({
      type: 'show',
      id: s.id,
      date: s.date,
      theme: s.theme,
      seriesId: s.series?.id,
      seriesName: s.series?.name,
      deletedAt: s.deleted_at,
      daysRemaining: daysRemaining(s.deleted_at),
    }))

  return { deletedSeries, deletedShows }
}
