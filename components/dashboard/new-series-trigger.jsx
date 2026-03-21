'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreateSeriesModal } from '@/components/forms/create-series-modal'

export function NewSeriesTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        + New Series
      </Button>
      <CreateSeriesModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
