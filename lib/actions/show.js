'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership } from './utils'

async function revalidateShow(showId, seriesId) {
  revalidatePath(`/dashboard/shows/${showId}`)
  if (seriesId) revalidatePath(`/dashboard/series/${seriesId}`)
  revalidatePath('/dashboard')
}

export async function toggleChecklistItem(itemId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: item } = await supabase
      .from('checklist_items')
      .select('done, show_id, shows ( series_id )')
      .eq('id', itemId)
      .single()

    if (!item) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, item.show_id, user.id)

    const { error } = await supabase
      .from('checklist_items')
      .update({ done: !item.done })
      .eq('id', itemId)

    if (error) return { error: error.message }

    await revalidateShow(item.show_id, item.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateShowNotes(showId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('shows')
      .update({
        notes_attendance: data.notes_attendance || null,
        notes_rating: data.notes_rating ?? null,
        notes_energy: data.notes_energy ?? null,
        notes_worked: data.notes_worked || null,
        notes_didnt_work: data.notes_didnt_work || null,
        notes_next_time: data.notes_next_time || null,
      })
      .eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${showId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function togglePerformerPaid(showPerformerId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: sp } = await supabase
      .from('show_performers')
      .select('is_paid, show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase
      .from('show_performers')
      .update({ is_paid: !sp.is_paid })
      .eq('id', showPerformerId)

    if (error) return { error: error.message }

    await revalidateShow(sp.show_id, sp.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateShow(showId, formData) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('shows')
      .update({
        date: formData.get('date')?.toString() || null,
        theme: formData.get('theme')?.toString().trim() || null,
        venue_name: formData.get('venue_name')?.toString().trim() || null,
        call_time: formData.get('call_time')?.toString() || null,
        doors_time: formData.get('doors_time')?.toString() || null,
        show_time: formData.get('show_time')?.toString() || null,
        status: formData.get('status')?.toString() || 'draft',
      })
      .eq('id', showId)

    if (error) return { error: error.message }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateTicketInfo(showId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('shows')
      .update({
        ticket_price: data.ticket_price ?? null,
        ticket_platform: data.ticket_platform || null,
        ticket_url: data.ticket_url || null,
        ticket_capacity: data.ticket_capacity ?? null,
        comp_tickets: data.comp_tickets ?? null,
      })
      .eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${showId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
