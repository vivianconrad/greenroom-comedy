'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons'
import { DropdownMenu } from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { setShowStatus, deleteShow } from '@/lib/actions/show'

export function ShowActionsMenu({ show }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isCancelled = show.status === 'cancelled'
  const isDone = show.status === 'completed'

  function handleCancel() {
    startTransition(async () => {
      const result = await setShowStatus(show.id, isCancelled ? 'planning' : 'cancelled')
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  function handleToggleDone() {
    startTransition(async () => {
      const result = await setShowStatus(show.id, isDone ? 'planning' : 'completed')
      if (result?.error) { alert(result.error); return }
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShow(show.id)
      if (result?.error) { alert(result.error); return }
      router.push(`/dashboard/series/${show.series_id}`)
    })
  }

  const items = [
    {
      label: isDone ? 'Unmark as done' : 'Mark as done',
      onClick: handleToggleDone,
    },
    {
      label: isCancelled ? 'Uncancel show' : 'Cancel show',
      onClick: handleCancel,
    },
    { separator: true },
    {
      label: 'Move to trash…',
      danger: true,
      onClick: () => setConfirmDelete(true),
    },
  ]

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
        title="Move show to trash?"
        description="This show will be moved to the trash and hidden from your dashboard."
        warning="You have 30 days to restore it before it's permanently deleted."
        confirmLabel="Move to trash"
        isPending={isPending}
      />
    </>
  )
}
