'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { getAuthenticatedUser, verifySeriesOwnership, getFormValue } from './utils'

/**
 * Creates a new series.
 *
 * If is_one_off is true, also inserts the initial show (no date yet — the user
 * sets it on the show detail page). The database trigger handles:
 *   - Auto-creating starter checklist collections based on show_type
 *   - Auto-generating a show checklist from the series template on show insert
 *
 * Redirects to:
 *   /dashboard/shows/[id]  — one-off (lands on the single show)
 *   /dashboard/series/[id] — recurring (lands on the series page)
 */
export async function createSeries(formData) {
  const supabase = await createClient()

  // Capture the redirect target outside try/catch — redirect() throws internally
  // in Next.js and must not be caught by our error handler.
  let redirectTo
  try {
    const user = await getAuthenticatedUser(supabase)

    const name = getFormValue(formData, 'name')
    if (!name) return { error: 'Series name is required.' }

    const frequency = getFormValue(formData, 'frequency')
    const isOneOff = frequency === 'one_off'

    const slug = slugify(name)

    const { data: series, error: seriesError } = await supabase
      .from('series')
      .insert({
        owner_id: user.id,
        name,
        slug,
        is_one_off: isOneOff,
        frequency: isOneOff ? null : frequency,
        show_type: getFormValue(formData, 'show_type'),
        venue_name: getFormValue(formData, 'venue_name'),
        default_call_time: getFormValue(formData, 'call_time'),
        default_doors_time: getFormValue(formData, 'doors_time'),
        default_show_time: getFormValue(formData, 'show_time'),
        description: getFormValue(formData, 'description'),
      })
      .select('id')
      .single()

    if (seriesError) return { error: seriesError.message }

    revalidatePath('/dashboard')

    if (isOneOff) {
      // Create the first (and only) show immediately so the user lands on its page
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert({
          series_id: series.id,
          status: 'draft',
          venue_name: getFormValue(formData, 'venue_name'),
          call_time: getFormValue(formData, 'call_time'),
          doors_time: getFormValue(formData, 'doors_time'),
          show_time: getFormValue(formData, 'show_time'),
        })
        .select('id')
        .single()

      if (showError) return { error: showError.message }

      redirectTo = `/dashboard/shows/${show.id}`
    } else {
      redirectTo = `/dashboard/series/${series.id}`
    }
  } catch (e) {
    return { error: e.message }
  }

  redirect(redirectTo)
}

/**
 * Updates an existing series's settings.
 */
export async function updateSeries(seriesId, formData) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const name = getFormValue(formData, 'name')
    if (!name) return { error: 'Series name is required.' }

    const { error } = await supabase
      .from('series')
      .update({
        name,
        frequency: getFormValue(formData, 'frequency'),
        show_type: getFormValue(formData, 'show_type'),
        venue_name: getFormValue(formData, 'venue_name'),
        default_call_time: getFormValue(formData, 'call_time'),
        default_doors_time: getFormValue(formData, 'doors_time'),
        default_show_time: getFormValue(formData, 'show_time'),
        description: getFormValue(formData, 'description'),
      })
      .eq('id', seriesId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Creates a show within an existing series.
 *
 * The database trigger auto-generates the checklist from the series template
 * on insert. Redirects to /dashboard/shows/[id].
 */
export async function createShow(seriesId, formData) {
  const supabase = await createClient()

  let showId
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const date = getFormValue(formData, 'date')
    if (!date) return { error: 'Show date is required.' }

    const { data: show, error } = await supabase
      .from('shows')
      .insert({
        series_id: seriesId,
        date,
        status: 'draft',
        theme: getFormValue(formData, 'theme'),
        venue_name: getFormValue(formData, 'venue_name'),
        call_time: getFormValue(formData, 'call_time'),
        doors_time: getFormValue(formData, 'doors_time'),
        show_time: getFormValue(formData, 'show_time'),
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/series/${seriesId}`)

    showId = show.id
  } catch (e) {
    return { error: e.message }
  }

  redirect(`/dashboard/shows/${showId}`)
}
