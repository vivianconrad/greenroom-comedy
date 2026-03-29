'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn, formatShortDate, daysUntil } from '@/lib/utils'
import { Breadcrumb } from '@/components/molecules/breadcrumb'
import { Pill } from '@/components/atoms/pill'
import { Button } from '@/components/atoms/button'
import { ShowTabBar } from '@/components/organisms/show/show-tab-bar'
import { DashboardTab } from '@/components/organisms/show/dashboard-tab'
import { ChecklistTab } from '@/components/organisms/show/checklist-tab'
import { PerformersTab } from '@/components/organisms/show/performers-tab'
import { RunOfShowTab } from '@/components/organisms/show/run-of-show-tab'
import { DutiesTab } from '@/components/organisms/show/duties-tab'
import { PromoTab } from '@/components/organisms/show/promo-tab'
import { TicketsTab } from '@/components/organisms/show/tickets-tab'
import { MaterialsTab } from '@/components/organisms/show/materials-tab'
import { CommsTab } from '@/components/organisms/show/comms-tab'
import { FinancialsTab } from '@/components/organisms/show/financials-tab'
import { NotesTab } from '@/components/organisms/show/notes-tab'
import { ShowDayMode } from '@/components/organisms/show/show-day-mode'
import { EditShowModal } from '@/components/organisms/forms/edit-show-modal'
import { ShowActionsMenu } from '@/components/organisms/show/show-actions-menu'

function DaysAwayPill({ date }) {
  const days = daysUntil(date)
  if (days < 0) return <Pill variant="neutral">Past</Pill>
  if (days === 0) return <Pill variant="danger">Tonight!</Pill>
  if (days <= 7) return <Pill variant="warning">{days}d away</Pill>
  return <Pill variant="info">{days}d away</Pill>
}

export function ShowPageLayout({ show, duties = [], activeTab, commLog = [], recipientGroups = {}, commsPreset = null, availablePerformers = [] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [editOpen, setEditOpen] = useState(false)

  const showDayMode = searchParams.get('mode') === 'showday'

  function enterShowDayMode() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', 'showday')
    router.push(`${pathname}?${params.toString()}`)
  }

  function exitShowDayMode() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('mode')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  if (showDayMode) {
    return <ShowDayMode show={show} duties={show.duties ?? duties} onExit={exitShowDayMode} />
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
          {show.hosts && (
            <p className="text-sm text-soft mt-1">
              Hosted by {show.hosts}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button variant="primary" size="sm" onClick={enterShowDayMode}>
            Show Day Mode →
          </Button>
          <ShowActionsMenu show={show} />
        </div>
        <EditShowModal open={editOpen} onClose={() => setEditOpen(false)} show={show} />
      </div>

      <ShowTabBar activeTab={activeTab} />

      {activeTab === 'dashboard' && <DashboardTab show={show} />}
      {activeTab === 'checklist' && <ChecklistTab show={show} />}
      {activeTab === 'performers' && <PerformersTab show={show} availablePerformers={availablePerformers} />}
      {activeTab === 'runofshow' && <RunOfShowTab show={show} />}
      {activeTab === 'duties' && <DutiesTab show={show} duties={show.duties ?? duties} />}
      {activeTab === 'promo' && <PromoTab show={show} />}
      {activeTab === 'tickets' && <TicketsTab show={show} />}
      {activeTab === 'materials' && <MaterialsTab show={show} />}
      {activeTab === 'comms' && (
        <CommsTab
          show={show}
          commLog={commLog}
          recipientGroups={recipientGroups}
          preset={commsPreset}
        />
      )}
      {activeTab === 'financials' && <FinancialsTab show={show} />}
      {activeTab === 'notes' && <NotesTab show={show} />}
    </div>
  )
}
