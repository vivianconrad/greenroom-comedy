'use client'

import { useState } from 'react'
import { formatDate, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

function replaceVars(body, show) {
  return (body ?? '')
    .replace(/\[name\]/g, show.series?.name ?? '')
    .replace(/\[date\]/g, show.date ? formatDate(show.date) : '')
    .replace(/\[callTime\]/g, formatTime(show.call_time) ?? '')
    .replace(/\[venue\]/g, show.venue_name ?? show.series?.venue_name ?? '')
    .replace(/\[showTime\]/g, formatTime(show.show_time) ?? '')
}

function CommCard({ template, show }) {
  const [copied, setCopied] = useState(false)
  const rendered = replaceVars(template.body, show)

  function handleCopy() {
    navigator.clipboard.writeText(rendered).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-card border border-peach p-5">
      <div className="flex justify-between items-start mb-3 gap-4">
        <h3 className="font-medium text-deep">{template.name}</h3>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => alert('Send functionality coming soon')}
          >
            Send
          </Button>
        </div>
      </div>
      <p className="text-sm text-deep whitespace-pre-wrap leading-relaxed">{rendered}</p>
    </div>
  )
}

export function CommsTab({ show }) {
  if (!show.commTemplates?.length) {
    return (
      <EmptyState
        title="No comms templates"
        description="Add communication templates to the series — they'll appear here with show details automatically filled in."
      />
    )
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-soft">
        Variables replaced: [name], [date], [callTime], [venue], [showTime]
      </p>
      {show.commTemplates.map((template) => (
        <CommCard key={template.id} template={template} show={show} />
      ))}
    </div>
  )
}
