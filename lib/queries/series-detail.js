import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   series                  (id, owner_id, name, is_one_off, frequency, show_type,
 *                             venue, default_call_time, default_doors_time, default_show_time,
 *                             tagline, description_long)
 *   shows                   (id, series_id, date, status, theme, venue,
 *                             call_time, doors_time, show_time, tickets_sold, capacity)
 *   checklist_items         (id, show_id, done, due_date)
 *   show_performers         (id, show_id, performer_id, confirmed)
 *   performer_series        (id, series_id, performer_id)
 *   performers              (id, name, act_type, instagram, book_again, audience_favourite)
 *   series_collections      (id, series_id, name, description, icon)
 *   collection_items        (id, collection_id, text, description, rejected)
 *   show_collection_selections (id, show_id, collection_item_id)
 *   checklist_templates     (id, series_id, task, category, condition, default_owner,
 *                             weeks_out, enabled, sort_order)
 *   comm_templates          (id, series_id, name, body, sort_order)
 *   duty_templates          (id, series_id, default_assigned_to, duty, time_note, sort_order)
 */

// ─── Series detail (shows tab data) ──────────────────────────────────────────

export async function getSeriesDetail(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(
      `
      id, name, is_one_off, frequency, show_type, venue, tagline, description_long,
      default_call_time, default_doors_time, default_show_time, default_hosts,
      internal_notes, logins, contacts,
      ticket_url, promo_code,
      performer_series ( performer_id ),
      shows (
        id, date, status, theme, venue, call_time, doors_time, show_time, tickets_sold, capacity, deleted_at,
        checklist_items ( id, done ),
        show_performers ( id, performer_id, confirmed )
      )
    `
    )
    .eq('id', seriesId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('getSeriesDetail error:', error.message)
    return null
  }

  const allShows = (data.shows ?? [])
    .filter((s) => !s.deleted_at)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

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
      venue: show.venue,
      call_time: show.call_time,
      doors_time: show.doors_time,
      show_time: show.show_time,
      tickets_sold: show.tickets_sold,
      capacity: show.capacity,
      checklistTotal,
      checklistDone,
      progress,
      confirmedPerformers: performers.filter((p) => p.confirmed).length,
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
      tickets_sold: show.tickets_sold,
    }
  }

  return {
    id: data.id,
    name: data.name,
    is_one_off: data.is_one_off,
    frequency: data.frequency,
    show_type: data.show_type,
    venue: data.venue,
    tagline: data.tagline,
    description_long: data.description_long,
    default_call_time: data.default_call_time,
    default_doors_time: data.default_doors_time,
    default_show_time: data.default_show_time,
    default_hosts: data.default_hosts,
    ticket_url: data.ticket_url,
    promo_code: data.promo_code,
    performerCount: (data.performer_series ?? []).length,
    internal_notes: data.internal_notes ?? null,
    logins: data.logins ?? [],
    contacts: data.contacts ?? [],
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
        id, text, description, rejected,
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
        status: item.rejected ? 'rejected' : usedInShow ? 'used' : 'available',
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
    .select('id, task, category, condition, default_owner, weeks_out, enabled, sort_order')
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
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getCommTemplates error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Duty templates ───────────────────────────────────────────────────────────

export async function getDutyTemplates(seriesId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('duty_templates')
    .select('id, default_assigned_to, duty, time_note, sort_order')
    .eq('series_id', seriesId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getDutyTemplates error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Performers for a series ──────────────────────────────────────────────────

export async function getSeriesPerformers(seriesId, { page = 0, pageSize = 50 } = {}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('performer_series')
    .select(`
      performer_id,
      performers (
        id, name, act_type, instagram, book_again, audience_favourite,
        show_performers (
          performer_id,
          shows ( id, date, series_id )
        )
      )
    `)
    .eq('series_id', seriesId)
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    console.error('getSeriesPerformers error:', error.message)
    return []
  }

  return (data ?? []).map(({ performers: p }) => {
    const appearances = (p.show_performers ?? []).filter(
      (sp) => sp.shows?.series_id === seriesId
    )
    let lastDate = null
    for (const sp of appearances) {
      const d = sp.shows?.date
      if (d && (!lastDate || d > lastDate)) lastDate = d
    }
    return {
      id: p.id,
      name: p.name,
      act_type: p.act_type,
      instagram: p.instagram,
      book_again: p.book_again,
      audience_favourite: p.audience_favourite,
      showCount: appearances.length,
      lastPerformed: lastDate,
    }
  })
}
