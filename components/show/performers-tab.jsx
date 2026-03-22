'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn, formatTime } from '@/lib/utils'
import { togglePerformerPaid } from '@/lib/actions/show'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/ui/pill'
import { Card } from '@/components/ui/card'

function StatusPill({ status }) {
  if (status === 'confirmed') return <Pill variant="success" className="text-xs">Ready</Pill>
  if (status === 'form_pending') return <Pill variant="warning" className="text-xs">Form pending</Pill>
  if (status === 'invited') return <Pill variant="neutral" className="text-xs">Unconfirmed</Pill>
  return <Pill variant="neutral" className="text-xs">TBD</Pill>
}

function DetailSection({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs text-soft uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-deep mt-0.5">{value}</dd>
    </div>
  )
}

export function PerformersTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedId, setSelectedId] = useState(null)

  const selected = show.performers.find((p) => p.showPerformerId === selectedId)

  function handleMarkPaid(showPerformerId) {
    startTransition(async () => {
      await togglePerformerPaid(showPerformerId)
      router.refresh()
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-soft">
          {show.performers.length} performer{show.performers.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <Link href="/dashboard/performers">
            <Button variant="ghost" size="sm">
              Browse database
            </Button>
          </Link>
          <Link href={`/dashboard/performers?addTo=${show.id}`}>
            <Button variant="secondary" size="sm">
              + Add performer
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Performer list */}
        <div className="flex-1 bg-white rounded-card border border-peach divide-y divide-peach">
          {show.performers.length === 0 && (
            <p className="px-4 py-10 text-center text-soft text-sm">No performers added yet.</p>
          )}
          {show.performers.map((p) => (
            <div
              key={p.showPerformerId}
              className={cn(
                'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-cream/60 transition-colors',
                selectedId === p.showPerformerId && 'bg-cream'
              )}
              onClick={() =>
                setSelectedId(selectedId === p.showPerformerId ? null : p.showPerformerId)
              }
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-deep">
                  {p.name}
                  {p.pronouns && (
                    <span className="text-soft font-normal ml-1.5 text-xs">({p.pronouns})</span>
                  )}
                </div>
                {p.performer_type && <div className="text-xs text-soft">{p.performer_type}</div>}
              </div>
              {p.set_length != null && (
                <span className="text-xs text-soft shrink-0">{p.set_length}m</span>
              )}
              {p.call_time && (
                <span className="text-xs text-soft shrink-0">{formatTime(p.call_time)}</span>
              )}
              <StatusPill status={p.status} />
            </div>
          ))}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="lg:w-72 shrink-0">
            <Card className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium text-deep">{selected.name}</h3>
                  {selected.pronouns && (
                    <p className="text-xs text-soft">{selected.pronouns}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-soft hover:text-mid text-xl leading-none ml-2"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <dl className="space-y-3 mb-4">
                <DetailSection label="Bio" value={selected.bio} />
                <DetailSection label="Walk-up song" value={selected.walk_up_song} />
                {selected.instagram && (
                  <div>
                    <dt className="text-xs text-soft uppercase tracking-wide">Instagram</dt>
                    <dd className="text-sm mt-0.5">
                      <a
                        href={`https://instagram.com/${selected.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-coral hover:underline"
                      >
                        {selected.instagram}
                      </a>
                    </dd>
                  </div>
                )}
                <DetailSection
                  label="Superlatives"
                  value={selected.superlative_suggestions}
                />
              </dl>

              <div className="flex flex-wrap gap-2 mb-4">
                {selected.tags_ok === true && (
                  <Pill variant="success" className="text-xs">Tags OK</Pill>
                )}
                {selected.tags_ok === false && (
                  <Pill variant="warning" className="text-xs">No tags</Pill>
                )}
                <Pill variant={selected.is_paid ? 'success' : 'neutral'} className="text-xs">
                  {selected.is_paid ? 'Paid' : 'Payment pending'}
                </Pill>
              </div>

              <Button
                variant={selected.is_paid ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => handleMarkPaid(selected.showPerformerId)}
                className="w-full"
              >
                {selected.is_paid ? 'Mark unpaid' : 'Mark paid'}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
