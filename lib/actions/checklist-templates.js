'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser, verifySeriesOwnership } from './utils'

function revalidateSeries(seriesId) {
  revalidatePath(`/dashboard/series/${seriesId}`)
}

export async function createChecklistTemplate(seriesId, { task, name, category, condition, default_owner, weeks_out }) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)

    const trimmedTask = (task ?? name)?.toString().trim()
    if (!trimmedTask) return { error: 'Task name is required.' }

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
      task: trimmedTask,
      category: category || null,
      condition: condition || null,
      default_owner: default_owner || null,
      weeks_out: weeks_out ?? null,
      enabled: true,
      sort_order: nextOrder,
    })

    if (error) return { error: error.message }
    revalidateSeries(seriesId)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Sets or clears the linked comm template on a checklist template, and
 * back-fills the same value onto any existing checklist_items that were
 * generated from that template.
 */
export async function updateChecklistTemplateLink(taskId, commTemplateId) {
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
      .update({ comm_template_id: commTemplateId ?? null })
      .eq('id', taskId)

    if (error) return { error: error.message }

    // Propagate to existing checklist_items generated from this template
    await supabase
      .from('checklist_items')
      .update({ comm_template_id: commTemplateId ?? null })
      .eq('template_id', taskId)

    revalidateSeries(task.series_id)
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
      .update({ enabled: isActive })
      .eq('id', taskId)

    if (error) return { error: error.message }
    revalidateSeries(task.series_id)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
