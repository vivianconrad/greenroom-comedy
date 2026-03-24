import { createClient } from '@/lib/supabase/server'

/**
 * Schema assumptions:
 *   comm_log (id, show_id, template_id, recipient_group, recipient_names,
 *             subject, body, sent_at, sent_via)
 *   show_crew (id, show_id, name, role, contact_method, contact_info)
 *   show_performers (id, show_id, performer_id, role)
 */

// ─── Comm log ─────────────────────────────────────────────────────────────────

export async function getCommLog(showId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comm_log')
    .select('id, sent_at, recipient_group, recipient_names, subject, body')
    .eq('show_id', showId)
    .order('sent_at', { ascending: false })

  if (error) {
    console.error('getCommLog error:', error.message)
    return []
  }
  return data ?? []
}

// ─── Recipient groups ─────────────────────────────────────────────────────────

/**
 * Returns { performers, crew } where:
 *   performers — show_performers rows with name + role
 *   crew       — show_crew rows (empty array if table doesn't exist yet)
 *
 * Client-side, callers compute named groups from this data:
 *   everyone   → performers + crew
 *   performers → performers
 *   hosts      → performers where role = 'host'
 *   tech       → crew + performers where role in tech/camera roles
 *   custom     → user-selected subset
 */
export async function getRecipientGroups(showId) {
  const supabase = await createClient()

  const [performersResult, crewResult] = await Promise.all([
    supabase
      .from('show_performers')
      .select('id, performer_id, role, act_type, performers ( id, name, instagram, email )')
      .eq('show_id', showId),
    supabase
      .from('show_crew')
      .select('id, name, role, contact_method, contact_info')
      .eq('show_id', showId),
  ])

  const performers = (performersResult.data ?? []).map((sp) => ({
    id: sp.id,
    performerId: sp.performer_id,
    name: sp.performers?.name ?? 'Unknown',
    instagram: sp.performers?.instagram ?? null,
    email: sp.performers?.email ?? null,
    // role takes precedence; fall back to act_type for older rows
    role: sp.role ?? sp.act_type ?? 'performer',
    type: 'performer',
  }))

  // crew table may not exist in all environments yet — treat as empty on error
  const crew = (crewResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role ?? 'crew',
    contact_method: c.contact_method ?? null,
    contact_info: c.contact_info ?? null,
    // treat contact_info as email when contact_method is Email
    email: c.contact_method?.toLowerCase() === 'email' ? (c.contact_info ?? null) : null,
    type: 'crew',
  }))

  return { performers, crew }
}
