import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeriesWithShows } from '@/lib/queries/series'
import { Sidebar } from '@/components/layout/sidebar'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const series = await getSeriesWithShows(user.id)

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Sidebar handles both desktop rail and mobile overlay */}
      <Sidebar series={series} />

      {/* Main content — scrolls independently */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
