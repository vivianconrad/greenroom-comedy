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

  const { error } = await supabase.rpc('reset_demo_data')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
