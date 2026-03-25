'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Returns the system-level default templates for all four sections.
 * These records live in system_* tables that are seeded by migration and
 * are never deleted by demo resets, so they always reflect the base starter kit.
 */
export async function getSystemTemplates() {
  const supabase = await createClient()

  const [checklist, duties, comms, collections] = await Promise.all([
    supabase.from('system_checklist_templates').select('*').order('sort_order'),
    supabase.from('system_duty_templates').select('*').order('sort_order'),
    supabase.from('system_comm_templates').select('*').order('sort_order'),
    supabase.from('system_collection_presets').select('*').order('sort_order'),
  ])

  return {
    checklist: checklist.data ?? [],
    duties: duties.data ?? [],
    comms: comms.data ?? [],
    collections: collections.data ?? [],
  }
}
