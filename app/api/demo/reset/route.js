import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEMO_EMAIL = 'demo@greenroom.app'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== DEMO_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // TODO: run demo seed SQL to reset the demo account to its original state
  // e.g. call a Supabase RPC: await supabase.rpc('reset_demo_data')

  return NextResponse.json({ ok: true, message: 'Demo data reset (placeholder)' })
}
