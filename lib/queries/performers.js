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

export async function getAllPerformers(userId, { page = 0, pageSize = 50 } = {}) {
  const supabase = await createClient()

  const { data: performers, error } = await supabase
    .from('performers')
    .select(
      `
      id, name, pronouns, act_type, instagram, email, contact_method,
      how_we_met, notes, tags, book_again, audience_favourite,
      performer_series (
        series_id,
        series ( id, name )
      ),
      show_performers ( performer_id, confirmed, shows ( id, date ) )
    `
    )
    .eq('owner_id', userId)
    .order('name', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) {
    console.error('getAllPerformers error:', error.message)
    return []
  }

  return (performers ?? []).map((p) => {
    const confirmed = (p.show_performers ?? []).filter((sp) => sp.confirmed)
    let lastDate = null
    for (const sp of confirmed) {
      const d = sp.shows?.date
      if (d && (!lastDate || d > lastDate)) lastDate = d
    }
    return {
      id: p.id,
      name: p.name,
      pronouns: p.pronouns,
      act_type: p.act_type,
      instagram: p.instagram,
      email: p.email,
      contact_method: p.contact_method,
      how_we_met: p.how_we_met,
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
}

// ─── Single performer detail ───────────────────────────────────────────────────

export async function getPerformerDetail(performerId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('performers')
    .select(
      `
      id, name, pronouns, act_type, instagram, email, contact_method,
      how_we_met, notes, tags, book_again, audience_favourite,
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
