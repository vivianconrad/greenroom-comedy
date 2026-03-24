'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership, verifySeriesOwnership } from './utils'
import { Resend } from 'resend'

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

// ─── Email sending ────────────────────────────────────────────────────────────

/**
 * Send emails to a set of recipients via Resend and log to comm_log.
 * recipients: Array of { name, email }
 * data: { subject, body, recipient_group, recipient_names }
 *
 * Requires env vars: RESEND_API_KEY, RESEND_FROM_EMAIL
 */
export async function sendEmailComm(showId, recipients, data) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)

    if (!process.env.RESEND_API_KEY) {
      return { error: 'Email sending is not configured (missing RESEND_API_KEY).' }
    }
    if (!process.env.RESEND_FROM_EMAIL) {
      return { error: 'Email sending is not configured (missing RESEND_FROM_EMAIL).' }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL

    const withEmails = recipients.filter((r) => r.email)
    if (withEmails.length === 0) {
      return { error: 'None of the selected recipients have an email address on file.' }
    }

    // Send one email per recipient so [name] can be personalised
    const results = await Promise.all(
      withEmails.map((r) => {
        const personalised = data.body.replace(/\[name\]/gi, r.name)
        return resend.emails.send({
          from,
          to: r.email,
          subject: data.subject || '(no subject)',
          text: personalised,
        })
      })
    )

    const failed = results.filter((r) => r.error)
    if (failed.length === results.length) {
      return { error: 'All emails failed to send. Check your Resend configuration.' }
    }

    // Log the send regardless of partial failures
    await supabase.from('comm_log').insert({
      show_id: showId,
      recipient_group: data.recipient_group,
      recipient_names: withEmails.map((r) => r.name),
      subject: data.subject || null,
      body: data.body,
      sent_via: 'email',
    })

    revalidatePath(`/dashboard/shows/${showId}`)

    if (failed.length > 0) {
      return { success: true, warning: `Sent to ${withEmails.length - failed.length} of ${withEmails.length} recipients. Some failed.` }
    }
    return { success: true, sent: withEmails.length }
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
