'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyPerformerOwnership, verifySeriesOwnership, getFormValue } from './utils'

function parseTags(raw) {
  if (!raw?.toString().trim()) return null
  return raw
    .toString()
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export async function createPerformer(formData) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const name = getFormValue(formData, 'name')
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase.from('performers').insert({
      user_id: user.id,
      name,
      pronouns: getFormValue(formData, 'pronouns'),
      performer_type: getFormValue(formData, 'act_type'),
      instagram: getFormValue(formData, 'instagram'),
      email: getFormValue(formData, 'email'),
      contact_method: getFormValue(formData, 'contact_method'),
      how_we_met: getFormValue(formData, 'how_we_met'),
      notes: getFormValue(formData, 'notes'),
      tags: parseTags(formData.get('tags')),
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updatePerformer(performerId, formData) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyPerformerOwnership(supabase, performerId, user.id)

    const name = getFormValue(formData, 'name')
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase
      .from('performers')
      .update({
        name,
        pronouns: getFormValue(formData, 'pronouns'),
        performer_type: getFormValue(formData, 'act_type'),
        instagram: getFormValue(formData, 'instagram'),
        email: getFormValue(formData, 'email'),
        contact_method: getFormValue(formData, 'contact_method'),
        how_we_met: getFormValue(formData, 'how_we_met'),
        notes: getFormValue(formData, 'notes'),
        tags: parseTags(formData.get('tags')),
      })
      .eq('id', performerId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function addPerformerToSeries(performerId, seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyPerformerOwnership(supabase, performerId, user.id)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase
      .from('performer_series')
      .insert({ performer_id: performerId, series_id: seriesId })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function removePerformerFromSeries(performerId, seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyPerformerOwnership(supabase, performerId, user.id)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase
      .from('performer_series')
      .delete()
      .eq('performer_id', performerId)
      .eq('series_id', seriesId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
