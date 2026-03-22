/**
 * Shared auth/ownership helpers for server actions.
 *
 * All functions throw on failure — callers should wrap in try/catch
 * and return { error: e.message }.
 */

/**
 * Reads a FormData field as a trimmed string, returning null if the field is
 * missing or empty. Prevents a null return from formData.get() being coerced
 * to the string "null" by a bare .toString() call.
 */
export const getFormValue = (formData, key) =>
  formData.get(key)?.toString().trim() || null

/**
 * Returns the authenticated user or throws.
 */
export async function getAuthenticatedUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user
}

/**
 * Verifies the show belongs to userId.
 * Returns the show row (with series_id) or throws.
 */
export async function verifyShowOwnership(supabase, showId, userId) {
  const { data: show } = await supabase
    .from('shows')
    .select('id, series_id, series!inner( owner_id )')
    .eq('id', showId)
    .eq('series.owner_id', userId)
    .single()
  if (!show) throw new Error('Not found or not authorized')
  return show
}

/**
 * Verifies the series belongs to userId.
 * Returns the series row or throws.
 */
export async function verifySeriesOwnership(supabase, seriesId, userId) {
  const { data: series } = await supabase
    .from('series')
    .select('id, owner_id')
    .eq('id', seriesId)
    .eq('owner_id', userId)
    .single()
  if (!series) throw new Error('Not found or not authorized')
  return series
}

/**
 * Verifies the performer belongs to userId.
 * Returns the performer row or throws.
 */
export async function verifyPerformerOwnership(supabase, performerId, userId) {
  const { data: performer } = await supabase
    .from('performers')
    .select('id, owner_id')
    .eq('id', performerId)
    .eq('owner_id', userId)
    .single()
  if (!performer) throw new Error('Not found or not authorized')
  return performer
}
