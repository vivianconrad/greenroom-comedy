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

    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`

    const { data: series, error: seriesError } = await supabase
      .from('series')
      .insert({
        owner_id: user.id,
        name,
        slug,
        is_one_off: isOneOff,
        frequency: isOneOff ? null : frequency,
        show_type: getFormValue(formData, 'show_type'),
        venue: getFormValue(formData, 'venue'),
        default_call_time: getFormValue(formData, 'call_time'),
        default_doors_time: getFormValue(formData, 'doors_time'),
        default_show_time: getFormValue(formData, 'show_time'),
        default_hosts: getFormValue(formData, 'default_hosts'),
        tagline: getFormValue(formData, 'tagline'),
        description_long: getFormValue(formData, 'description_long'),
      })
      .select('id')
      .single()

    if (seriesError) return { error: seriesError.message }

    // Insert templates chosen in the creation wizard (steps 2–5)
    async function insertFromJson(key, table, mapFn) {
      const raw = formData.get(key)
      if (!raw) return
      try {
        const items = JSON.parse(raw)
        if (items.length > 0) await supabase.from(table).insert(items.map(mapFn))
      } catch (_) {}
    }

    await insertFromJson('collections', 'series_collections', (c, i) => ({
      series_id: series.id,
      name: c.name.trim(),
      description: c.description?.trim() || null,
      icon: c.icon?.trim() || null,
      sort_order: i,
    }))

    await insertFromJson('checklist_templates', 'checklist_templates', (c, i) => ({
      series_id: series.id,
      task: c.task.trim(),
      category: c.category || null,
      stage: c.stage || null,
      weeks_out: c.weeks_out ?? null,
      default_owner: c.default_owner || null,
      enabled: true,
      sort_order: i,
    }))

    await insertFromJson('duty_templates', 'duty_templates', (c, i) => ({
      series_id: series.id,
      duty: c.duty.trim(),
      default_assigned_to: c.default_assigned_to || null,
      time_note: c.time_note?.trim() || null,
      sort_order: i,
    }))

    await insertFromJson('comm_templates', 'comm_templates', (c, i) => ({
      series_id: series.id,
      name: c.name.trim(),
      body: c.body?.trim() || null,
      sort_order: i,
    }))

    revalidatePath('/dashboard')

    if (isOneOff) {
      // Create the first (and only) show immediately so the user lands on its page
      const { data: show, error: showError } = await supabase
        .from('shows')
        .insert({
          series_id: series.id,
          date: getFormValue(formData, 'date'),
          status: 'planning',
          venue: getFormValue(formData, 'venue'),
          call_time: getFormValue(formData, 'call_time'),
          doors_time: getFormValue(formData, 'doors_time'),
          show_time: getFormValue(formData, 'show_time'),
          hosts: getFormValue(formData, 'default_hosts'),
        })
        .select('id')
        .single()

      if (showError) return { error: showError.message }

      redirectTo = `/dashboard/shows/${show.id}`
    } else {
      // Create any upcoming shows the user added in the wizard
      const rawDates = formData.get('show_dates')
      if (rawDates) {
        try {
          const dates = JSON.parse(rawDates).filter(Boolean)
          if (dates.length > 0) {
            const now = new Date()
            const venue = getFormValue(formData, 'venue')
            const call_time = getFormValue(formData, 'call_time')
            const doors_time = getFormValue(formData, 'doors_time')
            const show_time = getFormValue(formData, 'show_time')
            const hosts = getFormValue(formData, 'default_hosts')
            await supabase.from('shows').insert(
              dates.map((date) => ({
                series_id: series.id,
                date,
                status: new Date(date) < now ? 'completed' : 'planning',
                venue,
                call_time,
                doors_time,
                show_time,
                hosts,
              }))
            )
          }
        } catch (_) {}
      }

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
        venue: getFormValue(formData, 'venue'),
        default_call_time: getFormValue(formData, 'call_time'),
        default_doors_time: getFormValue(formData, 'doors_time'),
        default_show_time: getFormValue(formData, 'show_time'),
        default_hosts: getFormValue(formData, 'default_hosts'),
        tagline: getFormValue(formData, 'tagline'),
        description_long: getFormValue(formData, 'description_long'),
        ticket_url: getFormValue(formData, 'ticket_url'),
        promo_code: getFormValue(formData, 'promo_code'),
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

    // Verify ownership and pull ticket defaults in one query
    const { data: series } = await supabase
      .from('series')
      .select('id, owner_id, ticket_url, promo_code')
      .eq('id', seriesId)
      .eq('owner_id', user.id)
      .single()
    if (!series) throw new Error('Not found or not authorized')

    const date = getFormValue(formData, 'date')
    if (!date) return { error: 'Show date is required.' }

    const isPast = new Date(date) < new Date(new Date().toDateString())

    const { data: show, error } = await supabase
      .from('shows')
      .insert({
        series_id: seriesId,
        date,
        status: isPast ? 'completed' : 'planning',
        theme: getFormValue(formData, 'theme'),
        venue: getFormValue(formData, 'venue'),
        call_time: getFormValue(formData, 'call_time'),
        doors_time: getFormValue(formData, 'doors_time'),
        show_time: getFormValue(formData, 'show_time'),
        hosts: getFormValue(formData, 'hosts'),
        ticket_url: series.ticket_url ?? null,
        promo_code: series.promo_code ?? null,
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

export async function addContactToSeries(seriesId, contact) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const newContact = {
      id: crypto.randomUUID(),
      name: contact.name?.trim() || '',
      role: contact.role?.trim() || null,
      phone: contact.phone?.trim() || null,
      email: contact.email?.trim() || null,
      notes: contact.notes?.trim() || null,
    }

    if (!seriesId) return { error: 'Please select a series for this contact.' }

    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { data: row, error: fetchError } = await supabase
      .from('series')
      .select('contacts')
      .eq('id', seriesId)
      .single()

    if (fetchError) return { error: fetchError.message }

    const { error } = await supabase
      .from('series')
      .update({ contacts: [...(row.contacts ?? []), newContact] })
      .eq('id', seriesId)

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/series/${seriesId}`)

    revalidatePath('/dashboard/contacts')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateSeriesInfo(seriesId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase
      .from('series')
      .update({
        internal_notes: data.internal_notes || null,
        logins: data.logins ?? [],
        contacts: data.contacts ?? [],
      })
      .eq('id', seriesId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteSeries(seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const deletedAt = new Date().toISOString()

    // Cascade soft-delete to all shows in this series
    await supabase
      .from('shows')
      .update({ deleted_at: deletedAt })
      .eq('series_id', seriesId)
      .is('deleted_at', null)

    const { error } = await supabase
      .from('series')
      .update({ deleted_at: deletedAt })
      .eq('id', seriesId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function restoreSeries(seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    // Restore the series and all its shows that were deleted alongside it
    await supabase
      .from('shows')
      .update({ deleted_at: null })
      .eq('series_id', seriesId)

    const { error } = await supabase
      .from('series')
      .update({ deleted_at: null })
      .eq('id', seriesId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/trash')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
