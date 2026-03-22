'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function revalidateSeries(seriesId) {
  revalidatePath(`/dashboard/series/${seriesId}`)
  revalidatePath('/dashboard')
}

export async function createCollection(seriesId, name, description, icon) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const trimmedName = name?.toString().trim()
  if (!trimmedName) return { error: 'Collection name is required.' }

  const { error } = await supabase.from('series_collections').insert({
    series_id: seriesId,
    name: trimmedName,
    description: description?.toString().trim() || null,
    icon: icon?.toString().trim() || null,
  })

  if (error) return { error: error.message }
  revalidateSeries(seriesId)
  return { success: true }
}

export async function createCollectionItem(collectionId, text, description) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const trimmedText = text?.toString().trim()
  if (!trimmedText) return { error: 'Item text is required.' }

  // Look up seriesId for revalidation
  const { data: col } = await supabase
    .from('series_collections')
    .select('series_id')
    .eq('id', collectionId)
    .single()

  const { error } = await supabase.from('collection_items').insert({
    collection_id: collectionId,
    text: trimmedText,
    description: description?.toString().trim() || null,
    status: 'available',
  })

  if (error) return { error: error.message }
  if (col?.series_id) revalidateSeries(col.series_id)
  return { success: true }
}

export async function toggleCollectionItemRejected(itemId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  // Fetch current status + series_id via collection
  const { data: item } = await supabase
    .from('collection_items')
    .select('status, series_collections ( series_id )')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Item not found.' }

  const newStatus = item.status === 'rejected' ? 'available' : 'rejected'
  const { error } = await supabase
    .from('collection_items')
    .update({ status: newStatus })
    .eq('id', itemId)

  if (error) return { error: error.message }

  const seriesId = item.series_collections?.series_id
  if (seriesId) revalidateSeries(seriesId)
  return { success: true }
}

export async function deleteCollection(collectionId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: col } = await supabase
    .from('series_collections')
    .select('series_id')
    .eq('id', collectionId)
    .single()

  const { error } = await supabase
    .from('series_collections')
    .delete()
    .eq('id', collectionId)

  if (error) return { error: error.message }
  if (col?.series_id) revalidateSeries(col.series_id)
  return { success: true }
}

export async function deleteCollectionItem(itemId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: item } = await supabase
    .from('collection_items')
    .select('series_collections ( series_id )')
    .eq('id', itemId)
    .single()

  const { error } = await supabase
    .from('collection_items')
    .delete()
    .eq('id', itemId)

  if (error) return { error: error.message }

  const seriesId = item?.series_collections?.series_id
  if (seriesId) revalidateSeries(seriesId)
  return { success: true }
}
