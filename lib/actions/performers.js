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
      owner_id: user.id,
      name,
      pronouns: getFormValue(formData, 'pronouns'),
      act_type: getFormValue(formData, 'act_type'),
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
        act_type: getFormValue(formData, 'act_type'),
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

export async function importPerformers(rows) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const records = rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        owner_id: user.id,
        name: r.name.trim(),
        pronouns: r.pronouns || null,
        act_type: r.act_type || null,
        instagram: r.instagram || null,
        email: r.email || null,
        contact_method: r.contact_method || null,
        how_we_met: r.how_we_met || null,
        notes: r.notes || null,
        tags: parseTags(r.tags),
        book_again: r.book_again ?? null,
        audience_favourite: r.audience_favourite ?? null,
      }))

    if (!records.length) return { error: 'No valid performers to import.' }

    const { error } = await supabase.from('performers').insert(records)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true, count: records.length }
  } catch (e) {
    return { error: e.message }
  }
}

export async function fetchSheetAsCSV(url) {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) return { error: 'Not a valid Google Sheets URL.' }

    const spreadsheetId = match[1]
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/)
    const gid = gidMatch ? gidMatch[1] : '0'

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    const res = await fetch(exportUrl, { redirect: 'follow' })

    if (!res.ok) {
      return {
        error: `Could not fetch the sheet (HTTP ${res.status}). Make sure it's shared as "Anyone with the link".`,
      }
    }

    const csv = await res.text()
    return { csv }
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
