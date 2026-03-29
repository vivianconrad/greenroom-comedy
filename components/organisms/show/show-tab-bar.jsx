'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Tabs } from '@/components/atoms'

const BASE_TABS = [
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

function CountBadge({ children }) {
  return (
    <span className="text-xs font-normal bg-peach text-mid rounded px-1.5 py-0.5 leading-none">
      {children}
    </span>
  )
}

function labelWithCount(label, badge) {
  if (badge == null) return label
  return (
    <span className="inline-flex items-center gap-1.5">
      {label}
      <CountBadge>{badge}</CountBadge>
    </span>
  )
}

export function ShowTabBar({ activeTab, counts = {} }) {
  const router = useRouter()
  const pathname = usePathname()

  const tabs = BASE_TABS.map(({ key, label }) => {
    let badge = null
    if (key === 'performers' && counts.performers != null) {
      badge = counts.performers
    }
    if (key === 'checklist' && counts.checklist != null) {
      badge = `${counts.checklist.done}/${counts.checklist.total}`
    }
    return { key, label: labelWithCount(label, badge) }
  })

  return (
    <Tabs
      tabs={tabs}
      activeTab={activeTab}
      onChange={(key) => router.push(`${pathname}?tab=${key}`)}
      className="mb-6"
    />
  )
}
