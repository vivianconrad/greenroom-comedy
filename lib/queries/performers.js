import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   performers (id, owner_id, name, pronouns, act_type, instagram, email,
 *               contact_method, how_we_met, book_again, audience_favourite, notes, tags)
 *   performer_series (id, performer_id, series_id)
 *   series           (id, owner_id, name)
 *   show_performers  (id, show_id, performer_id, confirmed)
 *   shows            (id, series_id, date)
 */

// ─── All performers for a user ────────────────────────────────────────────────

export async function getAllPerformers(userId, { page = 0, pageSize = 50, search = '', seriesId = null } = {}) {
  const supabase = await createClient()

  // If filtering by series, resolve performer IDs first
  let seriesPerformerIds = null
  if (seriesId) {
    const { data: rows } = await supabase
      .from('performer_series')
      .select('performer_id')
      .eq('series_id', seriesId)
    seriesPerformerIds = (rows ?? []).map((r) => r.performer_id)
    // No performers in this series → return early
    if (seriesPerformerIds.length === 0) return { performers: [], total: 0 }
  }

  let query = supabase
    .from('performers')
    .select(
      `
      id, name, stage_name, pronouns, act_type, instagram, email, contact_method,
      how_we_met, clip_url, notes, tags, book_again, audience_favourite,
      performer_series (
        series_id,
        series ( id, name )
      ),
      show_performers ( performer_id, confirmed, shows ( id, date ) )
    `,
      { count: 'exact' }
    )
    .eq('owner_id', userId)
    .order('name', { ascending: true })

  if (search.trim()) {
    query = query.ilike('name', `%${search.trim()}%`)
  }

  if (seriesPerformerIds !== null) {
    query = query.in('id', seriesPerformerIds)
  }

  const { data: performers, count, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    console.error('getAllPerformers error:', error.message)
    return { performers: [], total: 0 }
  }

  const shaped = (performers ?? []).map((p) => {
    const confirmed = (p.show_performers ?? []).filter((sp) => sp.confirmed)
    let lastDate = null
    for (const sp of confirmed) {
      const d = sp.shows?.date
      if (d && (!lastDate || d > lastDate)) lastDate = d
    }
    return {
      id: p.id,
      name: p.name,
      stage_name: p.stage_name,
      pronouns: p.pronouns,
      act_type: p.act_type,
      instagram: p.instagram,
      email: p.email,
      contact_method: p.contact_method,
      how_we_met: p.how_we_met,
      clip_url: p.clip_url,
      notes: p.notes,
      tags: p.tags,
      book_again: p.book_again,
      audience_favourite: p.audience_favourite,
      series: (p.performer_series ?? [])
        .map((ps) => ({ id: ps.series?.id, name: ps.series?.name }))
        .filter((s) => s.id),
      showCount: confirmed.length,
      lastPerformed: lastDate,
    }
  })

  return { performers: shaped, total: count ?? 0 }
}

// ─── Single performer detail ───────────────────────────────────────────────────

export async function getPerformerDetail(performerId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('performers')
    .select(
      `
      id, name, stage_name, pronouns, act_type, instagram, email, contact_method,
      how_we_met, clip_url, notes, tags, book_again, audience_favourite,
      performer_series (
        series_id,
        series ( id, name )
      )
    `
    )
    .eq('id', performerId)
    .single()

  if (error) {
    console.error('getPerformerDetail error:', error.message)
    return null
  }

  return {
    ...data,
    series: (data.performer_series ?? [])
      .map((ps) => ({ id: ps.series?.id, name: ps.series?.name }))
      .filter((s) => s.id),
  }
}
