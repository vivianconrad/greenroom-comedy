'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser, verifySeriesOwnership } from './utils'

function revalidateSeries(seriesId) {
  revalidatePath(`/dashboard/series/${seriesId}`)
}

export async function createChecklistTemplate(seriesId, { name, category, condition, default_owner, weeks_out }) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const trimmedName = name?.toString().trim()
    if (!trimmedName) return { error: 'Task name is required.' }

    // Get current max sort_order
    const { data: existing } = await supabase
      .from('checklist_templates')
      .select('sort_order')
      .eq('series_id', seriesId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const { error } = await supabase.from('checklist_templates').insert({
      series_id: seriesId,
      name: trimmedName,
      category: category || null,
      condition: condition || null,
      default_owner: default_owner || null,
      weeks_out: weeks_out ?? null,
      is_active: true,
      sort_order: nextOrder,
    })

    if (error) return { error: error.message }
    revalidateSeries(seriesId)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

export async function updateChecklistTemplateActive(taskId, isActive) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: task } = await supabase
      .from('checklist_templates')
      .select('series_id')
      .eq('id', taskId)
      .single()

    if (!task) return { error: 'Not found or not authorized' }

    await verifySeriesOwnership(supabase, task.series_id, user.id)

    const { error } = await supabase
      .from('checklist_templates')
      .update({ is_active: isActive })
      .eq('id', taskId)

    if (error) return { error: error.message }
    revalidateSeries(task.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
