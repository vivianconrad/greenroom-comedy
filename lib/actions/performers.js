'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyPerformerOwnership, verifySeriesOwnership, getFormValue } from './utils'

function parseTags(raw) {
  const str = raw?.toString().trim()
  if (!str) return null
  return str.split(',').map((t) => t.trim()).filter(Boolean)
}

function toBoolean(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'boolean') return val
  return val.toString().trim().toLowerCase() === 'true'
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
      stage_name: getFormValue(formData, 'stage_name'),
      pronouns: getFormValue(formData, 'pronouns'),
      act_type: getFormValue(formData, 'act_type'),
      instagram: getFormValue(formData, 'instagram'),
      email: getFormValue(formData, 'email'),
      contact_method: getFormValue(formData, 'contact_method'),
      how_we_met: getFormValue(formData, 'how_we_met'),
      clip_url: getFormValue(formData, 'clip_url'),
      notes: getFormValue(formData, 'notes'),
      tags: parseTags(getFormValue(formData, 'tags')),
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
        stage_name: getFormValue(formData, 'stage_name'),
        pronouns: getFormValue(formData, 'pronouns'),
        act_type: getFormValue(formData, 'act_type'),
        instagram: getFormValue(formData, 'instagram'),
        email: getFormValue(formData, 'email'),
        contact_method: getFormValue(formData, 'contact_method'),
        how_we_met: getFormValue(formData, 'how_we_met'),
        clip_url: getFormValue(formData, 'clip_url'),
        notes: getFormValue(formData, 'notes'),
        tags: parseTags(getFormValue(formData, 'tags')),
      })
      .eq('id', performerId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function createPerformerAndAddToSeries(formData, seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const name = getFormValue(formData, 'name')
    if (!name) return { error: 'Name is required.' }

    const { data, error } = await supabase
      .from('performers')
      .insert({
        owner_id: user.id,
        name,
        pronouns: getFormValue(formData, 'pronouns'),
        act_type: getFormValue(formData, 'act_type'),
        instagram: getFormValue(formData, 'instagram'),
        email: getFormValue(formData, 'email'),
        contact_method: getFormValue(formData, 'contact_method'),
        how_we_met: getFormValue(formData, 'how_we_met'),
        notes: getFormValue(formData, 'notes'),
        tags: parseTags(getFormValue(formData, 'tags')),
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    const { error: linkError } = await supabase
      .from('performer_series')
      .insert({ performer_id: data.id, series_id: seriesId })

    if (linkError) return { error: linkError.message }

    revalidatePath('/dashboard/performers')
    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deletePerformers(performerIds) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    if (!performerIds?.length) return { error: 'No performers selected.' }

    const { error } = await supabase
      .from('performers')
      .delete()
      .in('id', performerIds)
      .eq('owner_id', user.id)

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

    if (error) {
      if (error.code === '23505') return { error: 'Performer is already in this series.' }
      return { error: error.message }
    }

    revalidatePath('/dashboard/performers')
    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

const IMPORT_LIMIT = 500

export async function importPerformers(rows) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const records = rows
      .slice(0, IMPORT_LIMIT)
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
        book_again: r.book_again != null ? toBoolean(r.book_again) : null,
        audience_favourite: r.audience_favourite != null ? toBoolean(r.audience_favourite) : null,
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
  const supabase = await createClient()
  try {
    await getAuthenticatedUser(supabase)

    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) return { error: 'Not a valid Google Sheets URL.' }

    const spreadsheetId = match[1]
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/)
    const gid = gidMatch ? gidMatch[1] : '0'

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    const res = await fetch(exportUrl, { redirect: 'follow' })

    if (!res.ok) {
      const msg =
        res.status === 403
          ? `Could not fetch the sheet (HTTP 403). Make sure it's shared as "Anyone with the link".`
          : res.status === 400
          ? `Could not fetch the sheet (HTTP 400). The sheet may not exist or the URL is invalid.`
          : `Could not fetch the sheet (HTTP ${res.status}).`
      return { error: msg }
    }

    const csv = await res.text()
    return { csv }
  } catch (e) {
    return { error: e.message }
  }
}

export async function createPerformerFromContact({ name, email, instagram }) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    if (!name?.trim()) return { error: 'Name is required.' }

    const { error } = await supabase.from('performers').insert({
      owner_id: user.id,
      name: name.trim(),
      email: email || null,
      instagram: instagram || null,
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    revalidatePath('/dashboard/contacts')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

// ─── Duplicate detection helpers (server-side only) ───────────────────────────

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function nameSimilarity(a, b) {
  const na = normalizeName(a)
  const nb = normalizeName(b)
  if (na === nb) return 1
  const ta = na.split(' ').filter((t) => t.length > 1)
  const tb = nb.split(' ').filter((t) => t.length > 1)
  if (!ta.length && !tb.length) return 0
  const setA = new Set(ta)
  const intersection = tb.filter((t) => setA.has(t)).length
  return intersection / new Set([...ta, ...tb]).size
}

export async function findPerformerDuplicates() {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: rows } = await supabase
      .from('performers')
      .select(
        `id, name, stage_name, pronouns, act_type, instagram, email,
         contact_method, how_we_met, clip_url, notes, tags, book_again, audience_favourite,
         performer_series ( series_id, series ( id, name ) ),
         show_performers ( confirmed )`
      )
      .eq('owner_id', user.id)
      .order('name')

    if (!rows?.length) return { suggestions: [] }

    const performers = rows.map((p) => ({
      ...p,
      series: (p.performer_series || [])
        .map((ps) => ({ id: ps.series?.id, name: ps.series?.name }))
        .filter((s) => s.id),
      showCount: (p.show_performers || []).filter((sp) => sp.confirmed).length,
    }))

    const suggestions = []
    for (let i = 0; i < performers.length; i++) {
      for (let j = i + 1; j < performers.length; j++) {
        const a = performers[i]
        const b = performers[j]
        const reasons = []

        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase())
          reasons.push('Same email')

        if (a.instagram && b.instagram) {
          const ia = a.instagram.replace('@', '').toLowerCase()
          const ib = b.instagram.replace('@', '').toLowerCase()
          if (ia === ib) reasons.push('Same Instagram')
        }

        if (nameSimilarity(a.name, b.name) >= 0.75) reasons.push('Similar name')

        const nn = (s) => normalizeName(s || '')
        if (a.stage_name && nn(a.stage_name) === nn(b.name)) reasons.push('Stage name match')
        if (b.stage_name && nn(b.stage_name) === nn(a.name)) reasons.push('Stage name match')

        if (reasons.length > 0) suggestions.push({ a, b, reasons })
      }
    }

    return { suggestions }
  } catch (e) {
    return { error: e.message, suggestions: [] }
  }
}

// profileData: explicit field values chosen by the user (from field-by-field merge UI).
// Tags and notes are always merged automatically on top of profileData.
export async function mergePerformers(keepId, deleteId, profileData = {}) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const [{ data: keep }, { data: del }] = await Promise.all([
      supabase.from('performers').select('*').eq('id', keepId).eq('owner_id', user.id).single(),
      supabase.from('performers').select('*').eq('id', deleteId).eq('owner_id', user.id).single(),
    ])

    if (!keep || !del) return { error: 'Not found or not authorized.' }

    // Find series that the delete performer is in but the keep performer is not
    const [{ data: keepSeries }, { data: delSeries }] = await Promise.all([
      supabase.from('performer_series').select('series_id').eq('performer_id', keepId),
      supabase.from('performer_series').select('series_id').eq('performer_id', deleteId),
    ])

    const keepSeriesIds = new Set((keepSeries || []).map((r) => r.series_id))
    const newSeriesIds = (delSeries || []).map((r) => r.series_id).filter((id) => !keepSeriesIds.has(id))

    const updates = []
    if (newSeriesIds.length > 0) {
      updates.push(
        supabase
          .from('performer_series')
          .insert(newSeriesIds.map((series_id) => ({ performer_id: keepId, series_id })))
      )
    }
    updates.push(
      supabase.from('show_performers').update({ performer_id: keepId }).eq('performer_id', deleteId)
    )
    await Promise.all(updates)

    // Merge tags (union) and notes (concatenate), applied on top of user's field choices
    const mergedTags = [...new Set([...(keep.tags || []), ...(del.tags || [])])].filter(Boolean)
    const mergedNotes =
      keep.notes && del.notes
        ? `${keep.notes}\n\n---\n\n${del.notes}`
        : keep.notes || del.notes || null

    await supabase
      .from('performers')
      .update({
        ...profileData,
        tags: mergedTags.length > 0 ? mergedTags : null,
        notes: mergedNotes,
      })
      .eq('id', keepId)

    await supabase.from('performers').delete().eq('id', deleteId).eq('owner_id', user.id)

    revalidatePath('/dashboard/performers')
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
