'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

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

    redirect(`/dashboard/shows/${show.id}`)
  }

  redirect(`/dashboard/series/${series.id}`)
}

/**
 * Creates a show within an existing series.
 *
 * The database trigger auto-generates the checklist from the series template
 * on insert. Redirects to /dashboard/shows/[id].
 */
export async function createShow(seriesId, formData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

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

  redirect(`/dashboard/shows/${show.id}`)
}
