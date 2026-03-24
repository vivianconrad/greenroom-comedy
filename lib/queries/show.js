import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   shows (id, series_id, date, status, theme, venue,
 *           call_time, doors_time, show_time,
 *           tickets_sold, capacity, ticket_price, ticket_platform, ticket_url,
 *           notes_attendance, notes_rating, notes_energy,
 *           notes_worked, notes_didnt_work, notes_next_time)
 *   checklist_items (id, show_id, template_id, task, done, due_date,
 *                    category, stage, owner, weeks_out, enabled, sort_order)
 *   show_performers (id, show_id, performer_id, role, confirmed, slot_order,
 *                    set_length, call_time, walk_up_song, bio, photo_url, tags_ok,
 *                    paid, payment_amount, payment_method)
 *   show_crew (id, show_id, name, role, contact_method, contact_info, call_time, notes)
 *   performers (id, name, pronouns, act_type, instagram, book_again, audience_favourite)
 *   series (id, name, venue, frequency, show_type,
 *           default_call_time, default_doors_time, default_show_time)
 *   comm_templates (id, series_id, name, body, sort_order)
 *   show_duties (id, show_id, assigned_to, duty, time_note, completed, sort_order)
 */

export async function getShowDuties(showId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('show_duties')
    .select('id, assigned_to, duty, time_note, completed, sort_order')
    .eq('show_id', showId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('getShowDuties error:', error.message)
    return []
  }

  // Group by assigned_to; null/empty → 'Unassigned'
  const map = {}
  for (const d of data ?? []) {
    const key = d.assigned_to?.trim() || 'Unassigned'
    if (!map[key]) map[key] = []
    map[key].push(d)
  }

  // Named people first (alphabetical), Unassigned last
  return Object.entries(map)
    .sort(([a], [b]) => {
      if (a === 'Unassigned') return 1
      if (b === 'Unassigned') return -1
      return a.localeCompare(b)
    })
    .map(([assignedTo, duties]) => ({ assignedTo, duties }))
}

export async function getShowDetail(showId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shows')
    .select(
      `
      id, series_id, date, status, theme, venue, hosts,
      call_time, doors_time, show_time,
      tickets_sold, capacity, ticket_price, ticket_platform, ticket_url,
      venue_cost,
      notes_attendance, notes_rating, notes_energy,
      notes_worked, notes_didnt_work, notes_next_time,
      series (
        id, name, venue, frequency, show_type,
        default_call_time, default_doors_time, default_show_time, default_hosts,
        comm_templates ( id, name, body, sort_order )
      ),
      checklist_items (
        id, task, done, due_date, category, stage,
        owner, weeks_out, enabled, sort_order, template_id
      ),
      show_performers (
        id, performer_id, role, confirmed, form_complete, slot_order, set_length, call_time,
        walk_up_song, bio, photo_url, tags_ok, paid, payment_amount, payment_method,
        performers (
          id, name, pronouns, act_type, instagram,
          book_again, audience_favourite
        )
      ),
      show_crew (
        id, name, role, contact_method, contact_info, call_time, notes
      ),
      show_duties (
        id, assigned_to, duty, time_note, completed, sort_order
      )
    `
    )
    .eq('id', showId)
    .single()

  if (error || !data) {
    console.error('getShowDetail error:', error?.message)
    return null
  }

  const performers = (data.show_performers ?? [])
    .sort((a, b) => (a.slot_order ?? 999) - (b.slot_order ?? 999))
    .map((sp) => ({
      showPerformerId: sp.id,
      performerId: sp.performer_id,
      role: sp.role ?? 'performer',
      act_type: sp.performers?.act_type ?? null,
      confirmed: sp.confirmed ?? false,
      form_complete: sp.form_complete ?? false,
      status: !sp.performer_id
        ? 'tbd'
        : sp.confirmed && sp.form_complete
        ? 'confirmed'
        : sp.confirmed
        ? 'form_pending'
        : 'invited',
      slot_order: sp.slot_order,
      set_length: sp.set_length,
      call_time: sp.call_time,
      walk_up_song: sp.walk_up_song ?? null,
      bio: sp.bio ?? null,
      photo_url: sp.photo_url ?? null,
      tags_ok: sp.tags_ok ?? null,
      paid: sp.paid ?? false,
      payment_amount: sp.payment_amount ?? null,
      payment_method: sp.payment_method ?? null,
      // performer profile fields
      id: sp.performers?.id ?? sp.performer_id,
      name: sp.performers?.name ?? 'Unknown',
      pronouns: sp.performers?.pronouns ?? null,
      instagram: sp.performers?.instagram ?? null,
      book_again: sp.performers?.book_again ?? false,
      audience_favourite: sp.performers?.audience_favourite ?? false,
    }))

  const checklistItems = (data.checklist_items ?? []).sort(
    (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
  )

  const crew = (data.show_crew ?? []).sort((a, b) => a.name.localeCompare(b.name))

  const rawDuties = (data.show_duties ?? []).sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
  const dutiesMap = {}
  for (const d of rawDuties) {
    const key = d.assigned_to?.trim() || 'Unassigned'
    if (!dutiesMap[key]) dutiesMap[key] = []
    dutiesMap[key].push(d)
  }
  const duties = Object.entries(dutiesMap)
    .sort(([a], [b]) => {
      if (a === 'Unassigned') return 1
      if (b === 'Unassigned') return -1
      return a.localeCompare(b)
    })
    .map(([assignedTo, ds]) => ({ assignedTo, duties: ds }))

  return {
    id: data.id,
    series_id: data.series_id,
    date: data.date,
    status: data.status,
    theme: data.theme,
    venue: data.venue,
    hosts: data.hosts,
    call_time: data.call_time,
    doors_time: data.doors_time,
    show_time: data.show_time,
    tickets_sold: data.tickets_sold,
    capacity: data.capacity,
    ticket_price: data.ticket_price,
    ticket_platform: data.ticket_platform,
    ticket_url: data.ticket_url,
    venue_cost: data.venue_cost ?? null,
    notes_attendance: data.notes_attendance,
    notes_rating: data.notes_rating,
    notes_energy: data.notes_energy,
    notes_worked: data.notes_worked,
    notes_didnt_work: data.notes_didnt_work,
    notes_next_time: data.notes_next_time,
    series: data.series,
    performers,
    checklistItems,
    crew,
    duties,
    commTemplates: (data.series?.comm_templates ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    ),
  }
}
