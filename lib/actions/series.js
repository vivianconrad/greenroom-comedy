'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createSeries(formData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const name = formData.get('name')?.toString().trim()
  if (!name) return { error: 'Series name is required.' }

  const { error } = await supabase.from('series').insert({
    user_id: user.id,
    name,
    is_one_off: formData.get('is_one_off') === 'true',
    frequency: formData.get('frequency')?.toString() || null,
    show_type: formData.get('show_type')?.toString() || null,
    venue_name: formData.get('venue_name')?.toString().trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
