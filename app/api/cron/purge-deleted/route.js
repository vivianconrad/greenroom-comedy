import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/cron/purge-deleted
 *
 * Permanently deletes series and shows that have been in the trash for >30 days.
 * Protect this route with a secret token so only your cron service can call it.
 *
 * Set CRON_SECRET in your environment variables, then configure your cron service
 * (Vercel Cron, GitHub Actions, etc.) to POST to this URL daily with:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * To use Supabase pg_cron instead (Pro plans only), run this SQL once:
 *   select cron.schedule('purge-deleted-items', '0 3 * * *', 'select purge_deleted_items()');
 */
export async function POST(request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('purge_deleted_items')

  if (error) {
    console.error('purge_deleted_items error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
