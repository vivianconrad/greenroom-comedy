'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/button'
import { CreateShowModal } from '@/components/organisms/forms/create-show-modal'

export function NewShowTrigger({ seriesId, defaults }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        + New Show
      </Button>
      <CreateShowModal
        seriesId={seriesId}
        defaults={defaults}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
