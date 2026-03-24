import { createClient } from '@/lib/supabase/server'

/**
 * Load the intake form data for a given show_performers row.
 * No auth required — this is a public page.
 */
export async function getIntakeData(showPerformerId) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('show_performers')
    .select(
      `
      id, confirmed, form_complete, bio, walk_up_song, tags_ok,
      performers ( id, name, pronouns, act_type ),
      shows (
        id, date, theme, venue, call_time, show_time,
        series ( name )
      )
    `
    )
    .eq('id', showPerformerId)
    .single()

  if (error || !data) return null

  return {
    showPerformerId: data.id,
    confirmed: data.confirmed ?? false,
    form_complete: data.form_complete ?? false,
    bio: data.bio ?? '',
    walk_up_song: data.walk_up_song ?? '',
    tags_ok: data.tags_ok,
    performer: data.performers
      ? {
          id: data.performers.id,
          name: data.performers.name,
          pronouns: data.performers.pronouns ?? null,
          act_type: data.performers.act_type ?? null,
        }
      : null,
    show: data.shows
      ? {
          id: data.shows.id,
          date: data.shows.date,
          theme: data.shows.theme ?? null,
          venue: data.shows.venue ?? null,
          call_time: data.shows.call_time ?? null,
          show_time: data.shows.show_time ?? null,
          seriesName: data.shows.series?.name ?? null,
        }
      : null,
  }
}
