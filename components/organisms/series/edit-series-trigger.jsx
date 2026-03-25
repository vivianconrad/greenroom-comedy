'use client'

import { useState } from 'react'
import { EditSeriesModal } from '@/components/organisms/forms/edit-series-modal'

export function EditSeriesTrigger({ series }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-9 px-3 text-sm font-medium font-body rounded-lg
          bg-transparent text-deep border border-mid hover:bg-peach transition-colors"
      >
        Edit Series
      </button>
      <EditSeriesModal open={open} onClose={() => setOpen(false)} series={series} />
    </>
  )
}
