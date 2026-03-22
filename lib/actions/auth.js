'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export async function login(formData) {
  const email = formData.get('email')
  const password = formData.get('password')

  if (!isValidEmail(email)) return { error: 'Invalid email format.' }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signup(formData) {
  const supabase = await createClient()

  const displayName = formData.get('display_name')
  const email = formData.get('email')
  const password = formData.get('password')

  if (!isValidEmail(email)) return { error: 'Invalid email format.' }

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
