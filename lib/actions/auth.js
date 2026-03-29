'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isValidEmail } from '@/lib/utils'

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
  const displayName = formData.get('display_name')
  const email = formData.get('email')
  const password = formData.get('password')

  if (!displayName?.trim()) return { error: 'Name is required.' }
  if (!isValidEmail(email)) return { error: 'Invalid email format.' }
  if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const supabase = await createClient()

  // Clear any existing session (e.g. demo mode) before creating a new account
  await supabase.auth.signOut()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })

  if (error) {
    if (error.message?.toLowerCase().includes('email rate limit')) {
      return { error: 'Too many sign-up attempts. Please wait a few minutes and try again.' }
    }
    return { error: error.message }
  }

  // If no session was established (email confirmation required), send to login
  if (!data.session) {
    redirect('/login?message=check-email')
  }

  redirect('/dashboard')
}

export async function loginAsDemo(mode = 'empty') {
  const password = process.env.DEMO_PASSWORD
  if (!password) return { error: 'Demo mode is not configured.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: 'demo@greenroom.app',
    password,
  })

  if (error) return { error: error.message }

  // Always wipe first so testers start clean
  const { error: resetError } = await supabase.rpc('reset_demo_data')
  if (resetError) return { error: resetError.message }

  if (mode === 'populated') {
    const { error: seedError } = await supabase.rpc('seed_demo_data')
    if (seedError) return { error: seedError.message }
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
