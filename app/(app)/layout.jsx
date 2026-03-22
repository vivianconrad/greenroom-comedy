import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSeriesWithShows } from '@/lib/queries/series'
import { Sidebar } from '@/components/layout/sidebar'
import { DemoBanner } from '@/components/layout/demo-banner'

const DEMO_EMAIL = 'demo@greenroom.app'

export default async function AppLayout({ children }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isDemo = user.email === DEMO_EMAIL
  const series = await getSeriesWithShows(user.id)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cream">
      <DemoBanner userEmail={user.email} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar handles both desktop rail and mobile overlay */}
        <Sidebar series={series} isDemo={isDemo} />

        {/* Main content — scrolls independently */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
