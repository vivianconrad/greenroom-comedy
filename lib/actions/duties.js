'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership, verifySeriesOwnership } from './utils'

async function revalidateShow(showId, seriesId) {
  revalidatePath(`/dashboard/shows/${showId}`)
  if (seriesId) revalidatePath(`/dashboard/series/${seriesId}`)
}

// ─── Local helpers ────────────────────────────────────────────────────────────

async function fetchDuty(supabase, dutyId) {
  const { data: duty } = await supabase
    .from('show_duties')
    .select('show_id, completed, shows ( series_id )')
    .eq('id', dutyId)
    .single()
  return duty
}

async function fetchTemplate(supabase, templateId) {
  const { data: template } = await supabase
    .from('duty_templates')
    .select('series_id')
    .eq('id', templateId)
    .single()
  return template
}

// ─── Show duties ──────────────────────────────────────────────────────────────

export async function createDuty(showId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase.from('show_duties').insert({
      show_id: showId,
      assigned_to: data.assigned_to?.trim() || 'Unassigned',
      duty: data.duty,
      time_note: data.time_note?.trim() || null,
      completed: false,
      sort_order: data.sort_order ?? 0,
    })

    if (error) return { error: error.message }

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateDuty(dutyId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const duty = await fetchDuty(supabase, dutyId)
    if (!duty) return { error: 'Not found or not authorized' }
    await verifyShowOwnership(supabase, duty.show_id, user.id)

    const patch = {}
    if (data.assigned_to !== undefined) patch.assigned_to = data.assigned_to?.trim() || 'Unassigned'
    if (data.duty !== undefined) patch.duty = data.duty
    if (data.time_note !== undefined) patch.time_note = data.time_note?.trim() || null
    if (data.sort_order !== undefined) patch.sort_order = data.sort_order

    const { error } = await supabase.from('show_duties').update(patch).eq('id', dutyId)

    if (error) return { error: error.message }

    await revalidateShow(duty.show_id, duty.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteDuty(dutyId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const duty = await fetchDuty(supabase, dutyId)
    if (!duty) return { error: 'Not found or not authorized' }
    await verifyShowOwnership(supabase, duty.show_id, user.id)

    const { error } = await supabase.from('show_duties').delete().eq('id', dutyId)

    if (error) return { error: error.message }

    await revalidateShow(duty.show_id, duty.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function toggleDutyCompleted(dutyId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const duty = await fetchDuty(supabase, dutyId)
    if (!duty) return { error: 'Not found or not authorized' }
    await verifyShowOwnership(supabase, duty.show_id, user.id)

    const { error } = await supabase
      .from('show_duties')
      .update({ completed: !duty.completed })
      .eq('id', dutyId)

    if (error) return { error: error.message }

    await revalidateShow(duty.show_id, duty.shows?.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Reorders duties within a show by updating all their sort_orders at once.
 * items: [{ id, sort_order }]
 */
export async function reorderDuties(showId, items) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    const show = await verifyShowOwnership(supabase, showId, user.id)

    await Promise.all(
      items.map(({ id, sort_order }) =>
        supabase.from('show_duties').update({ sort_order }).eq('id', id).eq('show_id', showId)
      )
    )

    await revalidateShow(showId, show.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

// ─── Duty templates ───────────────────────────────────────────────────────────

export async function createDutyTemplate(seriesId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase.from('duty_templates').insert({
      series_id: seriesId,
      default_assigned_to: data.assigned_to?.trim() || null,
      duty: data.duty,
      time_note: data.time_note?.trim() || null,
      sort_order: data.sort_order ?? 0,
    })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateDutyTemplate(templateId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const template = await fetchTemplate(supabase, templateId)
    if (!template) return { error: 'Not found or not authorized' }
    await verifySeriesOwnership(supabase, template.series_id, user.id)

    const patch = {}
    if (data.assigned_to !== undefined) patch.default_assigned_to = data.assigned_to?.trim() || null
    if (data.duty !== undefined) patch.duty = data.duty
    if (data.time_note !== undefined) patch.time_note = data.time_note?.trim() || null

    const { error } = await supabase.from('duty_templates').update(patch).eq('id', templateId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${template.series_id}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateDutyTemplateLink(templateId, commTemplateId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const template = await fetchTemplate(supabase, templateId)
    if (!template) return { error: 'Not found or not authorized' }
    await verifySeriesOwnership(supabase, template.series_id, user.id)

    const commId = commTemplateId ?? null
    const [{ error }, { error: propagateError }] = await Promise.all([
      supabase.from('duty_templates').update({ comm_template_id: commId }).eq('id', templateId),
      supabase.from('show_duties').update({ comm_template_id: commId }).eq('template_id', templateId),
    ])

    if (error) return { error: error.message }
    if (propagateError) return { error: propagateError.message }

    revalidatePath(`/dashboard/series/${template.series_id}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteDutyTemplate(templateId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const template = await fetchTemplate(supabase, templateId)
    if (!template) return { error: 'Not found or not authorized' }
    await verifySeriesOwnership(supabase, template.series_id, user.id)

    const { error } = await supabase.from('duty_templates').delete().eq('id', templateId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${template.series_id}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
