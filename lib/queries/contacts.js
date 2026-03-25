import { createClient } from '@/lib/supabase/server'

/**
 * Returns flattened contacts (from series JSONB) and deduplicated performers
 * (linked via performer_series), plus all series for filter pills.
 */
export async function getAllContactsData(userId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('series')
    .select(`
      id, name, contacts,
      performer_series (
        performer_id,
        performers ( id, name, stage_name, pronouns, act_type, email, instagram, contact_method )
      )
    `)
    .eq('owner_id', userId)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('getAllContactsData error:', error.message)
    return { contacts: [], performers: [], allSeries: [] }
  }

  const series = data ?? []

  // Flatten series JSONB contacts with their series info
  const contacts = series.flatMap((s) =>
    (s.contacts ?? []).map((c) => ({
      ...c,
      seriesId: s.id,
      seriesName: s.name,
    }))
  )

  // Deduplicate performers across series, collecting all their series
  const performerMap = new Map()
  for (const s of series) {
    for (const ps of s.performer_series ?? []) {
      if (!ps.performers) continue
      const p = ps.performers
      if (!performerMap.has(p.id)) {
        performerMap.set(p.id, { ...p, series: [] })
      }
      performerMap.get(p.id).series.push({ id: s.id, name: s.name })
    }
  }
  const performers = [...performerMap.values()]

  const allSeries = series.map((s) => ({ id: s.id, name: s.name }))

  return { contacts, performers, allSeries }
}
