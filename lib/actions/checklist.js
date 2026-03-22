'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUser, verifyShowOwnership, verifySeriesOwnership } from './utils'

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Bulk-sets is_active on checklist_items using at most 2 queries (one per
 * boolean value), both run in parallel via Promise.all.
 *
 * Returns an array of error strings. Empty array = full success.
 */
async function bulkUpdateChecklistItems(supabase, items) {
  if (!items.length) return []

  const trueIds = items.filter((i) => i.is_active).map((i) => i.id)
  const falseIds = items.filter((i) => !i.is_active).map((i) => i.id)

  const [trueResult, falseResult] = await Promise.all([
    trueIds.length
      ? supabase.from('checklist_items').update({ is_active: true }).in('id', trueIds)
      : { error: null },
    falseIds.length
      ? supabase.from('checklist_items').update({ is_active: false }).in('id', falseIds)
      : { error: null },
  ])

  const errors = []
  if (trueResult.error) errors.push(`activate items: ${trueResult.error.message}`)
  if (falseResult.error) errors.push(`deactivate items: ${falseResult.error.message}`)
  return errors
}

/**
 * Bulk-sets is_active on checklist_templates for items that carry a template_id.
 * Deduplicates template IDs before updating so a template shared by multiple
 * checklist items doesn't cause a conflict.
 *
 * Returns an array of error strings.
 */
async function bulkUpdateTemplates(supabase, items) {
  const withTemplate = items.filter((i) => i.template_id)
  if (!withTemplate.length) return []

  // Deduplicate: build template_id → is_active map (last value wins, but in
  // practice one template maps to exactly one is_active state per edit batch).
  const templateMap = new Map()
  for (const item of withTemplate) {
    templateMap.set(item.template_id, item.is_active)
  }

  const trueIds = []
  const falseIds = []
  for (const [templateId, isActive] of templateMap) {
    if (isActive) trueIds.push(templateId)
    else falseIds.push(templateId)
  }

  const [trueResult, falseResult] = await Promise.all([
    trueIds.length
      ? supabase.from('checklist_templates').update({ is_active: true }).in('id', trueIds)
      : { error: null },
    falseIds.length
      ? supabase.from('checklist_templates').update({ is_active: false }).in('id', falseIds)
      : { error: null },
  ])

  const errors = []
  if (trueResult.error) errors.push(`activate templates: ${trueResult.error.message}`)
  if (falseResult.error) errors.push(`deactivate templates: ${falseResult.error.message}`)
  return errors
}

// ── Exported actions ──────────────────────────────────────────────────────────

/**
 * Saves is_active changes to the current show's checklist only.
 * 2 queries max (one per boolean value), run in parallel.
 */
export async function saveChecklistToShowOnly(showId, items) {
  if (!items.length) return { success: true }

  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifyShowOwnership(supabase, showId, user.id)
  } catch (e) {
    return { error: e.message }
  }

  const errors = await bulkUpdateChecklistItems(supabase, items)

  revalidatePath(`/dashboard/shows/${showId}`)

  if (errors.length) return { error: errors.join('; '), partial: true }
  return { success: true }
}

/**
 * Saves is_active changes to the current show's checklist AND to the series
 * checklist_templates. Both table updates run in parallel (4 queries max).
 */
export async function saveChecklistToTemplate(seriesId, items) {
  if (!items.length) return { success: true }

  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)
  } catch (e) {
    return { error: e.message }
  }

  const [itemErrors, templateErrors] = await Promise.all([
    bulkUpdateChecklistItems(supabase, items),
    bulkUpdateTemplates(supabase, items),
  ])

  const errors = [...itemErrors, ...templateErrors]

  revalidatePath(`/dashboard/series/${seriesId}`)

  if (errors.length) return { error: errors.join('; '), partial: true }
  return { success: true }
}

/**
 * Saves is_active changes to the current show's checklist, to the series
 * templates, and pushes the changes to all other upcoming shows in the series.
 *
 * The "push" step calls the `push_checklist_is_active_to_upcoming_shows`
 * Postgres function (supabase/migrations/20260322000000_push_checklist_active_rpc.sql)
 * which handles the cross-show update atomically in the DB instead of a
 * JavaScript loop of N × M queries.
 */
export async function saveChecklistToTemplateAndPush(seriesId, showId, items) {
  if (!items.length) return { success: true }

  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    await verifySeriesOwnership(supabase, seriesId, user.id)
  } catch (e) {
    return { error: e.message }
  }

  // Step 1: current show items + series templates (parallel, 4 queries max)
  const [itemErrors, templateErrors] = await Promise.all([
    bulkUpdateChecklistItems(supabase, items),
    bulkUpdateTemplates(supabase, items),
  ])

  // Step 2: push to upcoming shows via RPC (single atomic DB operation)
  const itemsWithTemplates = items.filter((i) => i.template_id)
  let pushError = null

  if (itemsWithTemplates.length > 0) {
    const { error } = await supabase.rpc('push_checklist_is_active_to_upcoming_shows', {
      p_series_id: seriesId,
      p_exclude_show_id: showId,
      p_updates: itemsWithTemplates.map((i) => ({
        template_id: i.template_id,
        is_active: i.is_active,
      })),
    })
    if (error) pushError = `push to upcoming shows: ${error.message}`
  }

  const errors = [...itemErrors, ...templateErrors, ...(pushError ? [pushError] : [])]

  revalidatePath(`/dashboard/shows/${showId}`)
  revalidatePath(`/dashboard/series/${seriesId}`)
  revalidatePath('/dashboard')

  if (errors.length) return { error: errors.join('; '), partial: true }
  return { success: true }
}

/**
 * Adds a single new task directly to a show's checklist (not from a template).
 */
export async function addChecklistItem(showId, taskData) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)
    // verifyShowOwnership returns the show with series_id — no separate fetch needed
    const show = await verifyShowOwnership(supabase, showId, user.id)

    const { error } = await supabase.from('checklist_items').insert({
      show_id: showId,
      name: taskData.name,
      category: taskData.category ?? null,
      stage: taskData.stage ?? 'pre',
      default_owner: taskData.default_owner ?? null,
      weeks_out: taskData.weeks_out != null ? parseInt(taskData.weeks_out) : null,
      done: false,
      is_active: true,
    })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${showId}`)
    if (show.series_id) revalidatePath(`/dashboard/series/${show.series_id}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}

/**
 * Toggles is_active on a single checklist item (used outside of batch edit mode).
 */
export async function toggleChecklistItemEnabled(itemId) {
  const supabase = await createClient()
  try {
    const user = await getAuthenticatedUser(supabase)

    const { data: item } = await supabase
      .from('checklist_items')
      .select('is_active, show_id')
      .eq('id', itemId)
      .single()

    if (!item) return { error: 'Not found or not authorized' }

    await verifyShowOwnership(supabase, item.show_id, user.id)

    const { error } = await supabase
      .from('checklist_items')
      .update({ is_active: !item.is_active })
      .eq('id', itemId)

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/shows/${item.show_id}`)
    return { success: true }
  } catch (e) {
    return { error: e.message }
  }
}
