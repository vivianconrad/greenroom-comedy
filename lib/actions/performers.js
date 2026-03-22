'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyPerformerOwnership, verifySeriesOwnership } from './utils'

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

    const name = formData.get('name')?.toString().trim()
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase.from('performers').insert({
      user_id: user.id,
      name,
      pronouns: formData.get('pronouns')?.toString().trim() || null,
      performer_type: formData.get('act_type')?.toString().trim() || null,
      instagram: formData.get('instagram')?.toString().trim() || null,
      email: formData.get('email')?.toString().trim() || null,
      contact_method: formData.get('contact_method')?.toString().trim() || null,
      how_we_met: formData.get('how_we_met')?.toString().trim() || null,
      notes: formData.get('notes')?.toString().trim() || null,
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

    const name = formData.get('name')?.toString().trim()
    if (!name) return { error: 'Name is required.' }

    const { error } = await supabase
      .from('performers')
      .update({
        name,
        pronouns: formData.get('pronouns')?.toString().trim() || null,
        performer_type: formData.get('act_type')?.toString().trim() || null,
        instagram: formData.get('instagram')?.toString().trim() || null,
        email: formData.get('email')?.toString().trim() || null,
        contact_method: formData.get('contact_method')?.toString().trim() || null,
        how_we_met: formData.get('how_we_met')?.toString().trim() || null,
        notes: formData.get('notes')?.toString().trim() || null,
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
