import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDeletedItems } from '@/lib/queries/trash'
import { Breadcrumb } from '@/components/molecules/breadcrumb'
import { TrashList } from '@/components/organisms/trash/trash-list'

export const metadata = {
  title: 'Trash — Greenroom',
}

export default async function TrashPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { deletedSeries, deletedShows } = await getDeletedItems(user.id)
  const isEmpty = deletedSeries.length === 0 && deletedShows.length === 0

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <Breadcrumb
        className="mb-4"
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Trash' },
        ]}
      />

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-deep">Trash</h1>
        <p className="mt-1 text-sm font-body text-soft">
          Deleted items are permanently removed after 30 days.
        </p>
      </div>

      {isEmpty ? (
        <p className="text-sm font-body text-soft">Trash is empty.</p>
      ) : (
        <TrashList deletedSeries={deletedSeries} deletedShows={deletedShows} />
      )}
    </div>
  )
}
