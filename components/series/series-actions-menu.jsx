'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteSeries } from '@/lib/actions/series'

export function SeriesActionsMenu({ seriesId, seriesName, showCount = 0 }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSeries(seriesId)
      if (result?.error) { alert(result.error); return }
      router.push('/dashboard')
    })
  }

  const items = [
    {
      label: 'Move to trash…',
      danger: true,
      onClick: () => setConfirmDelete(true),
    },
  ]

  const description = showCount > 0
    ? `"${seriesName}" and its ${showCount} show${showCount === 1 ? '' : 's'} will be moved to the trash and hidden from your dashboard.`
    : `"${seriesName}" will be moved to the trash and hidden from your dashboard.`

  return (
    <>
      <DropdownMenu
        trigger={<FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" aria-hidden="true" />}
        items={items}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Move series to trash?"
        description={description}
        warning="You have 30 days to restore it before it's permanently deleted."
        confirmLabel="Move to trash"
        isPending={isPending}
      />
    </>
  )
}
