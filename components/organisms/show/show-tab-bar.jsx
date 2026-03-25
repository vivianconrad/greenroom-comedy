'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Tabs } from '@/components/atoms'

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'performers', label: 'Performers' },
  { key: 'runofshow', label: 'Run of Show' },
  { key: 'duties', label: 'Duties' },
  { key: 'promo', label: 'Promo' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'materials', label: 'Materials' },
  { key: 'comms', label: 'Comms' },
  { key: 'financials', label: 'Financials' },
  { key: 'notes', label: 'Notes' },
]

export function ShowTabBar({ activeTab }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Tabs
      tabs={TABS}
      activeTab={activeTab}
      onChange={(key) => router.push(`${pathname}?tab=${key}`)}
      className="mb-6"
    />
  )
}
