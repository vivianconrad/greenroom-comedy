'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership, getFormValue } from './utils'

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
        notes_attendance: data.notes_attendance != null && data.notes_attendance !== '' ? parseInt(data.notes_attendance, 10) : null,
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
      .select('paid, show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase
      .from('show_performers')
      .update({ paid: !sp.paid })
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
        date: getFormValue(formData, 'date'),
        theme: getFormValue(formData, 'theme'),
        venue: getFormValue(formData, 'venue'),
        hosts: getFormValue(formData, 'hosts'),
        call_time: getFormValue(formData, 'call_time'),
        doors_time: getFormValue(formData, 'doors_time'),
        show_time: getFormValue(formData, 'show_time'),
        status: getFormValue(formData, 'status') || 'planning',
        venue_cost: formData.get('venue_cost') ? parseFloat(formData.get('venue_cost')) : null,
      })
      .eq('id', showId)

    if (error) return { error: error.message }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function togglePerformerConfirmed(showPerformerId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: sp } = await supabase
      .from('show_performers')
      .select('confirmed, show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase
      .from('show_performers')
      .update({ confirmed: !sp.confirmed })
      .eq('id', showPerformerId)

    if (error) return { error: error.message }

    await revalidateShow(sp.show_id, sp.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updatePerformerRole(showPerformerId, role) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: sp } = await supabase
      .from('show_performers')
      .select('show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase
      .from('show_performers')
      .update({ role })
      .eq('id', showPerformerId)

    if (error) return { error: error.message }

    await revalidateShow(sp.show_id, sp.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function addPerformerToShow(showId, performerId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('show_performers')
      .insert({ show_id: showId, performer_id: performerId, role: 'performer' })

    if (error) {
      if (error.code === '23505') return { error: 'Performer is already on this show.' }
      return { error: error.message }
    }

    // Keep the performer database in sync: if this show belongs to a series,
    // ensure the performer is linked to that series in performer_series.
    if (show.series_id) {
      await supabase
        .from('performer_series')
        .upsert(
          { performer_id: performerId, series_id: show.series_id },
          { onConflict: 'performer_id,series_id', ignoreDuplicates: true }
        )
      revalidatePath('/dashboard/performers')
    }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function createCrewMember(showId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const name = data.name?.trim()
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase.from('show_crew').insert({
      show_id: showId,
      name,
      role: data.role?.trim() || null,
      contact_method: data.contact_method?.trim() || null,
      contact_info: data.contact_info?.trim() || null,
      call_time: data.call_time || null,
      notes: data.notes?.trim() || null,
    })

    if (error) return { error: error.message }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateCrewMember(crewId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: crew } = await supabase
      .from('show_crew')
      .select('show_id, shows ( series_id )')
      .eq('id', crewId)
      .single()

    if (!crew) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, crew.show_id, user.id)

    const name = data.name?.trim()
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase
      .from('show_crew')
      .update({
        name,
        role: data.role?.trim() || null,
        contact_method: data.contact_method?.trim() || null,
        contact_info: data.contact_info?.trim() || null,
        call_time: data.call_time || null,
        notes: data.notes?.trim() || null,
      })
      .eq('id', crewId)

    if (error) return { error: error.message }

    await revalidateShow(crew.show_id, crew.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteCrewMember(crewId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: crew } = await supabase
      .from('show_crew')
      .select('show_id, shows ( series_id )')
      .eq('id', crewId)
      .single()

    if (!crew) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, crew.show_id, user.id)

    const { error } = await supabase.from('show_crew').delete().eq('id', crewId)

    if (error) return { error: error.message }

    await revalidateShow(crew.show_id, crew.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Persist a new slot_order for a set of show_performers rows.
 * orderedIds: Array of show_performers UUIDs in the desired display order.
 */
export async function removePerformerFromShow(showPerformerId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: sp } = await supabase
      .from('show_performers')
      .select('show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase.from('show_performers').delete().eq('id', showPerformerId)

    if (error) return { error: error.message }

    await revalidateShow(sp.show_id, sp.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updatePerformerSlot(showPerformerId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: sp } = await supabase
      .from('show_performers')
      .select('show_id, shows ( series_id )')
      .eq('id', showPerformerId)
      .single()

    if (!sp) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, sp.show_id, user.id)

    const { error } = await supabase
      .from('show_performers')
      .update({
        set_length: data.set_length !== '' && data.set_length != null ? parseInt(data.set_length, 10) || null : null,
        call_time: data.call_time || null,
      })
      .eq('id', showPerformerId)

    if (error) return { error: error.message }

    await revalidateShow(sp.show_id, sp.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function reorderPerformers(showId, orderedIds) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const updates = orderedIds.map((id, index) =>
      supabase
        .from('show_performers')
        .update({ slot_order: index + 1 })
        .eq('id', id)
        .eq('show_id', showId)
    )

    await Promise.all(updates)

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function setShowStatus(showId, status) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('shows')
      .update({ status })
      .eq('id', showId)

    if (error) return { error: error.message }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteShow(showId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)
    const seriesId = show.series_id

    const { error } = await supabase
      .from('shows')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    revalidatePath('/dashboard')
    return { success: true, seriesId }
  } catch (e) {
    return { error: e.message }
  }
}

export async function bulkDeleteShows(showIds) {
  if (!showIds?.length) return { error: 'No shows selected.' }
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    // Verify all shows belong to the user (via series ownership)
    const { data: ownedShows } = await supabase
      .from('shows')
      .select('id, series_id, series!inner( owner_id )')
      .in('id', showIds)
      .eq('series.owner_id', user.id)

    if (!ownedShows || ownedShows.length !== showIds.length) {
      throw new Error('Not authorized for all selected shows')
    }

    const seriesIds = [...new Set(ownedShows.map((s) => s.series_id).filter(Boolean))]

    const { error } = await supabase
      .from('shows')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', showIds)

    if (error) return { error: error.message }

    for (const sid of seriesIds) revalidatePath(`/dashboard/series/${sid}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function permanentlyDeleteShow(showId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase.from('shows').delete().eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/trash')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function restoreShow(showId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase
      .from('shows')
      .update({ deleted_at: null })
      .eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/trash')
    revalidatePath('/dashboard')
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
        promo_code: data.promo_code || null,
        capacity: data.capacity ?? null,
      })
      .eq('id', showId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${showId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
