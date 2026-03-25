import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllPerformers } from '@/lib/queries/performers'
import { PerformersClient } from '@/components/performers/performers-client'

export const metadata = {
  title: 'Performer Database — Greenroom',
}

export default async function PerformersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [performers, seriesRows, sheetSync] = await Promise.all([
    getAllPerformers(user.id),
    supabase
      .from('series')
      .select('id, name')
      .eq('owner_id', user.id)
      .order('name', { ascending: true })
      .then(({ data }) => data ?? []),
    supabase
      .from('sheet_syncs')
      .select('id, sheet_url, column_mapping, last_synced_at, sync_count')
      .eq('owner_id', user.id)
      .eq('entity_type', 'performers')
      .is('series_id', null)
      .maybeSingle()
      .then(({ data }) => data ?? null),
  ])

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-deep">
            Performer Database
          </h1>
          <p className="text-sm font-body text-soft mt-1">
            <span className="font-semibold text-deep">{performers.length}</span>{' '}
            {performers.length === 1 ? 'performer' : 'performers'}
          </p>
        </div>
      </div>

      {/* ── Interactive client section ── */}
      <div className="flex flex-col gap-5">
        <PerformersClient performers={performers} allSeries={seriesRows} sheetSync={sheetSync} />
      </div>
    </div>
  )
}
