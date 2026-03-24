'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Submit the performer intake form.
 * No auth required — identified by the show_performers UUID.
 */
export async function submitIntakeForm(showPerformerId, data) {
  const supabase = await createClient()

  const { bio, walk_up_song, tags_ok } = data

  const { error } = await supabase
    .from('show_performers')
    .update({
      bio: bio?.trim() || null,
      walk_up_song: walk_up_song?.trim() || null,
      tags_ok: tags_ok ?? null,
      confirmed: true,
      form_complete: true,
    })
    .eq('id', showPerformerId)

  if (error) {
    console.error('submitIntakeForm error:', error.message)
    return { error: 'Something went wrong. Please try again.' }
  }

  return { success: true }
}
