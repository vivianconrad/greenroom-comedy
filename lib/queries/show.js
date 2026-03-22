import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   shows (id, series_id, date, status, theme, venue_name,
 *           call_time, doors_time, show_time,
 *           ticket_count, ticket_price, ticket_platform, ticket_url, ticket_capacity, comp_tickets,
 *           venue_cost,
 *           notes_attendance, notes_rating, notes_energy,
 *           notes_worked, notes_didnt_work, notes_next_time)
 *   checklist_items (id, show_id, template_id, name, done, due_date,
 *                    category, stage, default_owner, weeks_out, is_active, sort_order)
 *   show_performers (id, show_id, performer_id, status, slot_order,
 *                    set_length, call_time, act_type, is_paid, payment_amount)
 *   performers (id, name, pronouns, performer_type, bio, walk_up_song, instagram,
 *               tags_ok, superlative_suggestions, photo_received,
 *               is_book_again, is_audience_fav)
 *   series (id, name, venue_name, frequency, show_type,
 *           default_call_time, default_doors_time, default_show_time)
 *   comm_templates (id, series_id, name, body)
 */

export async function getShowDetail(showId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('shows')
    .select(
      `
      id, series_id, date, status, theme, venue_name,
      call_time, doors_time, show_time,
      ticket_count, ticket_price, ticket_platform, ticket_url, ticket_capacity, comp_tickets,
      venue_cost,
      notes_attendance, notes_rating, notes_energy,
      notes_worked, notes_didnt_work, notes_next_time,
      series (
        id, name, venue_name, frequency, show_type,
        default_call_time, default_doors_time, default_show_time,
        comm_templates ( id, name, body )
      ),
      checklist_items (
        id, name, done, due_date, category, stage,
        default_owner, weeks_out, is_active, sort_order, template_id
      ),
      show_performers (
        id, performer_id, status, slot_order, set_length, call_time,
        act_type, is_paid, payment_amount,
        performers (
          id, name, pronouns, performer_type, bio, walk_up_song, instagram,
          tags_ok, superlative_suggestions, photo_received,
          is_book_again, is_audience_fav
        )
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
      status: sp.status,
      slot_order: sp.slot_order,
      set_length: sp.set_length,
      call_time: sp.call_time,
      act_type: sp.act_type,
      is_paid: sp.is_paid ?? false,
      payment_amount: sp.payment_amount ?? null,
      // performer profile fields
      id: sp.performers?.id ?? sp.performer_id,
      name: sp.performers?.name ?? 'Unknown',
      pronouns: sp.performers?.pronouns ?? null,
      performer_type: sp.performers?.performer_type ?? null,
      bio: sp.performers?.bio ?? null,
      walk_up_song: sp.performers?.walk_up_song ?? null,
      instagram: sp.performers?.instagram ?? null,
      tags_ok: sp.performers?.tags_ok ?? null,
      superlative_suggestions: sp.performers?.superlative_suggestions ?? null,
      photo_received: sp.performers?.photo_received ?? false,
      is_book_again: sp.performers?.is_book_again ?? false,
      is_audience_fav: sp.performers?.is_audience_fav ?? false,
    }))

  const checklistItems = (data.checklist_items ?? []).sort(
    (a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)
  )

  return {
    id: data.id,
    series_id: data.series_id,
    date: data.date,
    status: data.status,
    theme: data.theme,
    venue_name: data.venue_name,
    call_time: data.call_time,
    doors_time: data.doors_time,
    show_time: data.show_time,
    ticket_count: data.ticket_count,
    ticket_price: data.ticket_price,
    ticket_platform: data.ticket_platform,
    ticket_url: data.ticket_url,
    ticket_capacity: data.ticket_capacity,
    comp_tickets: data.comp_tickets,
    venue_cost: data.venue_cost,
    notes_attendance: data.notes_attendance,
    notes_rating: data.notes_rating,
    notes_energy: data.notes_energy,
    notes_worked: data.notes_worked,
    notes_didnt_work: data.notes_didnt_work,
    notes_next_time: data.notes_next_time,
    series: data.series,
    performers,
    checklistItems,
    commTemplates: data.series?.comm_templates ?? [],
  }
}
