'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatShortDate, daysUntil } from '@/lib/utils'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Pill } from '@/components/ui/pill'
import { Button } from '@/components/ui/button'
import { ShowTabBar } from './show-tab-bar'
import { DashboardTab } from './dashboard-tab'
import { ChecklistTab } from './checklist-tab'
import { PerformersTab } from './performers-tab'
import { RunOfShowTab } from './run-of-show-tab'
import { PromoTab } from './promo-tab'
import { TicketsTab } from './tickets-tab'
import { MaterialsTab } from './materials-tab'
import { CommsTab } from './comms-tab'
import { FinancialsTab } from './financials-tab'
import { NotesTab } from './notes-tab'
import { ShowDayMode } from './show-day-mode'
import { EditShowModal } from '@/components/forms/edit-show-modal'

function DaysAwayPill({ date }) {
  const days = daysUntil(date)
  if (days < 0) return <Pill variant="neutral">Past</Pill>
  if (days === 0) return <Pill variant="danger">Tonight!</Pill>
  if (days <= 7) return <Pill variant="warning">{days}d away</Pill>
  return <Pill variant="info">{days}d away</Pill>
}

export function ShowPageLayout({ show, activeTab }) {
  const [showDayMode, setShowDayMode] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (showDayMode) {
    return <ShowDayMode show={show} onExit={() => setShowDayMode(false)} />
  }

  const breadcrumb = [
    { label: 'Dashboard', href: '/dashboard' },
    {
      label: show.series?.name ?? 'Series',
      href: `/dashboard/series/${show.series_id}`,
    },
    { label: formatShortDate(show.date) },
  ]

  return (
    <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">
      <Breadcrumb items={breadcrumb} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mt-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-deep">{show.series?.name}</h1>
            <Pill variant="neutral">{formatShortDate(show.date)}</Pill>
            {show.theme && <Pill variant="neutral">{show.theme}</Pill>}
            <DaysAwayPill date={show.date} />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowDayMode(true)}>
            Show Day Mode →
          </Button>
        </div>
        <EditShowModal open={editOpen} onClose={() => setEditOpen(false)} show={show} />
      </div>

      <ShowTabBar activeTab={activeTab} />

      {activeTab === 'dashboard' && <DashboardTab show={show} />}
      {activeTab === 'checklist' && <ChecklistTab show={show} />}
      {activeTab === 'performers' && <PerformersTab show={show} />}
      {activeTab === 'runofshow' && <RunOfShowTab show={show} />}
      {activeTab === 'promo' && <PromoTab show={show} />}
      {activeTab === 'tickets' && <TicketsTab show={show} />}
      {activeTab === 'materials' && <MaterialsTab show={show} />}
      {activeTab === 'comms' && <CommsTab show={show} />}
      {activeTab === 'financials' && <FinancialsTab show={show} />}
      {activeTab === 'notes' && <NotesTab show={show} />}
    </div>
  )
}
