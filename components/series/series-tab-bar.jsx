'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Tabs } from '@/components/ui/tabs'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'shows', label: 'Shows' },
  { key: 'performers', label: 'Performers' },
  {
    key: 'checklist',
    label: 'Checklist Template',
    tooltip: 'A default list of tasks that gets copied to every new show in this series. Toggle tasks off for shows where they don\'t apply.',
  },
  {
    key: 'collections',
    label: 'Collections',
    tooltip: 'Group shows together — e.g. by theme or run. Useful for organising recurring formats within a series.',
  },
  {
    key: 'duties',
    label: 'Duty Templates',
    tooltip: 'Day-of assignments (e.g. "Run Instagram stories") that are automatically added to every new show. Assign them to team members and add a time note.',
  },
  {
    key: 'comms',
    label: 'Comms',
    tooltip: 'Reusable message templates for performer confirmations, reminders, and show-night comms. Use variables like [date] and [venue] that fill in automatically.',
  },
  { key: 'info', label: 'Info' },
]

export function SeriesTabBar({ activeTab }) {
  const router = useRouter()
  const pathname = usePathname()

  function handleChange(tab) {
    router.push(`${pathname}?tab=${tab}`)
  }

  return <Tabs tabs={TABS} activeTab={activeTab} onChange={handleChange} />
}
