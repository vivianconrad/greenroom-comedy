import { notFound } from 'next/navigation'
import { getShowDetail, getAvailablePerformersForShow } from '@/lib/queries/show'
import { getCommLog, getRecipientGroups } from '@/lib/queries/comms'
import { ShowPageLayout } from '@/components/templates/show-page-layout'

export default async function ShowPage({ params, searchParams }) {
  const { id } = await params
  const { tab = 'dashboard', group, template } = await searchParams

  const [show, commLog, recipientGroups, availablePerformers] = await Promise.all([
    getShowDetail(id),
    getCommLog(id),
    getRecipientGroups(id),
    getAvailablePerformersForShow(id),
  ])

  if (!show) notFound()

  // Pass comms pre-selection through if navigating from another tab
  const commsPreset = group || template ? { group, template } : null

  return (
    <ShowPageLayout
      show={show}
      activeTab={tab}
      commLog={commLog}
      recipientGroups={recipientGroups}
      commsPreset={commsPreset}
      availablePerformers={availablePerformers}
    />
  )
}
