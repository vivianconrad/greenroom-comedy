import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   series                  (id, user_id, name, is_one_off, frequency, show_type,
 *                             venue_name, default_call_time, default_doors_time, default_show_time,
 *                             description)
 *   shows                   (id, series_id, date, status, theme, venue_name,
 *                             call_time, doors_time, show_time, ticket_count)
 *   checklist_items         (id, show_id, done, due_date)
 *   show_performers         (id, show_id, performer_id, status)
 *   performer_series        (id, series_id, performer_id)
 *   performers              (id, name, performer_type, instagram, is_book_again, is_audience_fav)
 *   series_collections      (id, series_id, name, description, icon)
 *   collection_items        (id, collection_id, text, description, status)
 *                             status: 'available' | 'rejected'
 *   show_collection_selections (id, show_id, collection_item_id)
 *   checklist_templates     (id, series_id, name, category, condition, default_owner,
 *                             weeks_out, is_active, sort_order)
 *   comm_templates          (id, series_id, name, body)
 */

// ─── Series detail (shows tab data) ──────────────────────────────────────────

export async function getSeriesDetail(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(
      `
      id, name, is_one_off, frequency, show_type, venue_name, description,
      default_call_time, default_doors_time, default_show_time,
      performer_series ( performer_id ),
      shows (
        id, date, status, theme, venue_name, call_time, doors_time, show_time, ticket_count,
        checklist_items ( id, done ),
        show_performers ( id, performer_id, status )
      )
    `
    )
    .eq('id', seriesId)
    .single()

  if (error) {
    console.error('getSeriesDetail error:', error.message)
    return null
  }

  const allShows = (data.shows ?? []).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )

  function shapeUpcoming(show) {
    const items = show.checklist_items ?? []
    const checklistTotal = items.length
    const checklistDone = items.filter((i) => i.done).length
    const progress =
      checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0
    const performers = show.show_performers ?? []
    return {
      id: show.id,
      date: show.date,
      status: show.status,
      theme: show.theme,
      venue_name: show.venue_name,
      call_time: show.call_time,
      doors_time: show.doors_time,
      show_time: show.show_time,
      ticket_count: show.ticket_count,
      checklistTotal,
      checklistDone,
      progress,
      confirmedPerformers: performers.filter((p) => p.status === 'confirmed').length,
      totalPerformers: performers.length,
    }
  }

  function shapePast(show) {
    return {
      id: show.id,
      date: show.date,
      status: show.status,
      theme: show.theme,
      totalPerformers: (show.show_performers ?? []).length,
      ticket_count: show.ticket_count,
    }
  }

  return {
    id: data.id,
    name: data.name,
    is_one_off: data.is_one_off,
    frequency: data.frequency,
    show_type: data.show_type,
    venue_name: data.venue_name,
    description: data.description,
    default_call_time: data.default_call_time,
    default_doors_time: data.default_doors_time,
    default_show_time: data.default_show_time,
    performerCount: (data.performer_series ?? []).length,
    upcomingShows: allShows.filter((s) => s.status !== 'completed').map(shapeUpcoming),
    pastShows: allShows.filter((s) => s.status === 'completed').reverse().map(shapePast),
  }
}

// ─── Collections ──────────────────────────────────────────────────────────────

export async function getCollectionsForSeries(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series_collections')
    .select(
      `
      id, name, description, icon,
      collection_items (
        id, text, description, status,
        show_collection_selections (
          show_id,
          shows ( id, date )
        )
      )
    `
    )
    .eq('series_id', seriesId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getCollectionsForSeries error:', error.message)
    return []
  }

  return (data ?? []).map((col) => ({
    ...col,
    items: (col.collection_items ?? []).map((item) => {
      const selections = item.show_collection_selections ?? []
      const usedInShow = selections[0]?.shows ?? null
      return {
        id: item.id,
        text: item.text,
        description: item.description,
        // 'rejected' from status field, 'used' if a selection exists, else 'available'
        status: item.status === 'rejected' ? 'rejected' : usedInShow ? 'used' : 'available',
        usedInShow: usedInShow ? { id: usedInShow.id, date: usedInShow.date } : null,
      }
    }),
  }))
}

// ─── Checklist template ───────────────────────────────────────────────────────

export async function getChecklistTemplate(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('checklist_templates')
    .select('id, name, category, condition, default_owner, weeks_out, is_active, sort_order')
    .eq('series_id', seriesId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getChecklistTemplate error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Comm templates ───────────────────────────────────────────────────────────

export async function getCommTemplates(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comm_templates')
    .select('id, name, body')
    .eq('series_id', seriesId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getCommTemplates error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Performers for a series ──────────────────────────────────────────────────

export async function getSeriesPerformers(seriesId) {
  const supabase = await createClient()

  // Performer records
  const { data: psData, error: psError } = await supabase
    .from('performer_series')
    .select('performer_id, performers ( id, name, performer_type, instagram, is_book_again, is_audience_fav )')
    .eq('series_id', seriesId)

  if (psError) {
    console.error('getSeriesPerformers error:', psError.message)
    return []
  }

  // Show appearances in this series
  const { data: spData } = await supabase
    .from('show_performers')
    .select('performer_id, shows!inner ( id, date, series_id )')
    .eq('shows.series_id', seriesId)

  // Build per-performer stats
  const statsMap = {}
  for (const sp of spData ?? []) {
    if (!statsMap[sp.performer_id]) {
      statsMap[sp.performer_id] = { count: 0, lastDate: null }
    }
    statsMap[sp.performer_id].count++
    const d = sp.shows?.date
    if (d && (!statsMap[sp.performer_id].lastDate || d > statsMap[sp.performer_id].lastDate)) {
      statsMap[sp.performer_id].lastDate = d
    }
  }

  return (psData ?? []).map(({ performer_id, performers: p }) => ({
    id: p.id,
    name: p.name,
    performer_type: p.performer_type,
    instagram: p.instagram,
    is_book_again: p.is_book_again,
    is_audience_fav: p.is_audience_fav,
    showCount: statsMap[performer_id]?.count ?? 0,
    lastPerformed: statsMap[performer_id]?.lastDate ?? null,
  }))
}
