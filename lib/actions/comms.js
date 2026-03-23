'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership, verifySeriesOwnership } from './utils'

// ─── Comm log ─────────────────────────────────────────────────────────────────

/**
 * Records a message as sent in comm_log.
 * data: { recipient_group, recipient_names, subject, body, sent_via }
 */
export async function logMessageSent(showId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase.from('comm_log').insert({
      show_id: showId,
      recipient_group: data.recipient_group,
      recipient_names: data.recipient_names ?? null,
      subject: data.subject || null,
      body: data.body,
      sent_via: data.sent_via || null,
    })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${showId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

// ─── Comm templates ───────────────────────────────────────────────────────────

export async function createCommTemplate(seriesId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase.from('comm_templates').insert({
      series_id: seriesId,
      name: data.name?.trim(),
      body: data.body?.trim() || null,
    })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateCommTemplate(templateId, seriesId, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase
      .from('comm_templates')
      .update({
        name: data.name?.trim(),
        body: data.body?.trim() || null,
      })
      .eq('id', templateId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function deleteCommTemplate(templateId, seriesId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const { error } = await supabase
      .from('comm_templates')
      .delete()
      .eq('id', templateId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/series/${seriesId}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
