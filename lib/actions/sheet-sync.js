'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser } from './utils'

// ─── Internal helpers ──────────────────────────────────────────────────────────

function parseTags(raw) {
  const str = raw?.toString().trim()
  if (!str) return null
  return str.split(',').map((t) => t.trim()).filter(Boolean)
}

function parseBool(val) {
  if (val == null || val === '') return null
  const s = String(val).toLowerCase().trim()
  if (['yes', 'y', 'true', '1', 'x', '✓', '✔'].includes(s)) return true
  if (['no', 'n', 'false', '0'].includes(s)) return false
  return null
}

/** Fetch a public Google Sheet as CSV text. Does not require auth. */
async function fetchCSV(url) {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) return { error: 'Not a valid Google Sheets URL.' }

  const spreadsheetId = match[1]
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/)
  const gid = gidMatch ? gidMatch[1] : '0'

  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }

  // Try the gviz/tq endpoint first — more permissive for server-side requests
  const gvizUrl = gidMatch
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
    : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`

  let res = await fetch(gvizUrl, { redirect: 'follow', headers })

  // Fall back to export endpoint if gviz fails
  if (!res.ok) {
    const exportUrl = gidMatch
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
      : `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
    res = await fetch(exportUrl, { redirect: 'follow', headers })
  }

  if (!res.ok) {
    const msg =
      res.status === 403
        ? `Could not fetch the sheet (HTTP 403). Make sure it's shared as "Anyone with the link".`
        : res.status === 400
        ? `Could not fetch the sheet (HTTP 400). The sheet may not exist or the URL is invalid.`
        : `Could not fetch the sheet (HTTP ${res.status}).`
    return { error: msg }
  }
  return { csv: await res.text() }
}

/** Parse CSV text → array of row arrays using XLSX (works server-side). */
async function csvToRows(csvText) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(csvText, { type: 'string' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

/**
 * Given raw rows and a column mapping { "Sheet Header": "field_key" | "skip" },
 * returns an array of normalised performer objects (name is guaranteed).
 */
function buildPerformerRows(rawRows, columnMapping) {
  const [headerRow, ...dataRows] = rawRows
  const performers = []
  for (const row of dataRows) {
    const p = {}
    headerRow.forEach((h, i) => {
      const field = columnMapping[String(h)]
      if (field && field !== 'skip') p[field] = row[i]
    })
    const name = p.name?.toString().trim()
    if (!name) continue
    performers.push({
      name,
      pronouns:          p.pronouns?.toString().trim()      || null,
      act_type:          p.act_type?.toString().trim()       || null,
      instagram:         p.instagram?.toString().trim()      || null,
      email:             p.email?.toString().trim()          || null,
      contact_method:    p.contact_method?.toString().trim() || null,
      how_we_met:        p.how_we_met?.toString().trim()     || null,
      notes:             p.notes?.toString().trim()          || null,
      tags:              parseTags(p.tags),
      book_again:        parseBool(p.book_again),
      audience_favourite: parseBool(p.audience_favourite),
    })
  }
  return performers
}

// ─── Public actions ────────────────────────────────────────────────────────────

/**
 * Save (create or replace) a sheet sync config for a given entity type.
 * Replaces any existing config for the same owner + entity_type + series_id.
 */
export async function saveSheetSync({ entityType, seriesId = null, sheetUrl, columnMapping }) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    // Delete any existing config for this slot first
    await supabase
      .from('sheet_syncs')
      .delete()
      .eq('owner_id', user.id)
      .eq('entity_type', entityType)
      .is('series_id', seriesId ?? null)

    const { data, error } = await supabase
      .from('sheet_syncs')
      .insert({
        owner_id:       user.id,
        entity_type:    entityType,
        series_id:      seriesId ?? null,
        sheet_url:      sheetUrl,
        column_mapping: columnMapping,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true, id: data.id }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Delete a sheet sync config by ID.
 */
export async function deleteSheetSync(syncId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { error } = await supabase
      .from('sheet_syncs')
      .delete()
      .eq('id', syncId)
      .eq('owner_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/performers')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Fetch the sheet for a saved sync config and upsert performers.
 * - Existing performers (matched by name, case-insensitive) are updated.
 * - New names are inserted.
 * Returns { inserted, updated } counts.
 */
export async function runSheetSync(syncId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    // Load config
    const { data: sync, error: syncErr } = await supabase
      .from('sheet_syncs')
      .select('*')
      .eq('id', syncId)
      .eq('owner_id', user.id)
      .single()

    if (syncErr || !sync) return { error: 'Sync config not found.' }

    // Fetch CSV
    const csvResult = await fetchCSV(sync.sheet_url)
    if (csvResult.error) return { error: csvResult.error }

    // Parse
    const rawRows = await csvToRows(csvResult.csv)
    if (rawRows.length < 2) return { error: 'Sheet appears empty.' }

    const incoming = buildPerformerRows(rawRows, sync.column_mapping)
    if (!incoming.length) return { error: 'No valid rows found (name column required).' }

    // Load existing performers (name → id map)
    const { data: existing } = await supabase
      .from('performers')
      .select('id, name')
      .eq('owner_id', user.id)

    const nameToId = {}
    for (const p of existing ?? []) {
      nameToId[p.name.toLowerCase().trim()] = p.id
    }

    const toInsert = []
    const toUpdate = []

    for (const p of incoming) {
      const existingId = nameToId[p.name.toLowerCase().trim()]
      if (existingId) {
        toUpdate.push({ id: existingId, ...p })
      } else {
        toInsert.push({ owner_id: user.id, ...p })
      }
    }

    // Run updates (batch via Promise.all)
    if (toUpdate.length) {
      await Promise.all(
        toUpdate.map(({ id, ...fields }) =>
          supabase.from('performers').update(fields).eq('id', id)
        )
      )
    }

    // Run inserts
    if (toInsert.length) {
      const { error: insertErr } = await supabase.from('performers').insert(toInsert)
      if (insertErr) return { error: insertErr.message }
    }

    // Update sync metadata
    await supabase
      .from('sheet_syncs')
      .update({
        last_synced_at: new Date().toISOString(),
        sync_count: (sync.sync_count ?? 0) + 1,
      })
      .eq('id', syncId)

    revalidatePath('/dashboard/performers')
    return { success: true, inserted: toInsert.length, updated: toUpdate.length }
  } catch (e) {
    return { error: e.message }
  }
}
