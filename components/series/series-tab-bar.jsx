'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Tabs } from '@/components/ui/tabs'

const TABS = [
  { key: 'shows', label: 'Shows' },
  { key: 'performers', label: 'Performers' },
  { key: 'collections', label: 'Collections' },
  { key: 'checklist', label: 'Checklist Template' },
  { key: 'duties', label: 'Duty Templates' },
  { key: 'comms', label: 'Comms' },
]

export function SeriesTabBar({ activeTab }) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(tab) {
    router.push(`${pathname}?tab=${tab}`)
  }

  return <Tabs tabs={TABS} activeTab={activeTab} onChange={handleChange} />
}
