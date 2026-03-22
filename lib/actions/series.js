'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import { getAuthenticatedUser, verifySeriesOwnership } from './utils'

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

    const name = formData.get('name')?.toString().trim()
    if (!name) return { error: 'Series name is required.' }

    const frequency = formData.get('frequency')?.toString() || null
    const isOneOff = frequency === 'one_off'

    const slug = slugify(name)

    const { data: series, error: seriesError } = await supabase
      .from('series')
      .insert({
        user_id: user.id,
        name,
        slug,
        is_one_off: isOneOff,
        frequency: isOneOff ? null : frequency,
        show_type: formData.get('show_type')?.toString() || null,
        venue_name: formData.get('venue_name')?.toString().trim() || null,
        default_call_time: formData.get('call_time')?.toString() || null,
        default_doors_time: formData.get('doors_time')?.toString() || null,
        default_show_time: formData.get('show_time')?.toString() || null,
        description: formData.get('description')?.toString().trim() || null,
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
          venue_name: formData.get('venue_name')?.toString().trim() || null,
          call_time: formData.get('call_time')?.toString() || null,
          doors_time: formData.get('doors_time')?.toString() || null,
          show_time: formData.get('show_time')?.toString() || null,
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

    const name = formData.get('name')?.toString().trim()
    if (!name) return { error: 'Series name is required.' }

    const { error } = await supabase
      .from('series')
      .update({
        name,
        frequency: formData.get('frequency')?.toString() || null,
        show_type: formData.get('show_type')?.toString() || null,
        venue_name: formData.get('venue_name')?.toString().trim() || null,
        default_call_time: formData.get('call_time')?.toString() || null,
        default_doors_time: formData.get('doors_time')?.toString() || null,
        default_show_time: formData.get('show_time')?.toString() || null,
        description: formData.get('description')?.toString().trim() || null,
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

    const date = formData.get('date')?.toString()
    if (!date) return { error: 'Show date is required.' }

    const { data: show, error } = await supabase
      .from('shows')
      .insert({
        series_id: seriesId,
        date,
        status: 'draft',
        theme: formData.get('theme')?.toString().trim() || null,
        venue_name: formData.get('venue_name')?.toString().trim() || null,
        call_time: formData.get('call_time')?.toString() || null,
        doors_time: formData.get('doors_time')?.toString() || null,
        show_time: formData.get('show_time')?.toString() || null,
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
