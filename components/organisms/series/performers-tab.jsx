'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Pill } from '@/components/atoms/pill'
import { EmptyState } from '@/components/atoms/empty-state'
import { AddToSeriesModal } from './add-to-series-modal'
import { PerformerCombobox } from '@/components/atoms/performer-combobox'
import { addPerformerToSeries } from '@/lib/actions/performers'
import { formatShortDate } from '@/lib/utils'

function BoolIcon({ value }) {
  if (value == null) return <span className="text-soft/40">—</span>
  return value ? (
    <span className="text-green font-bold">✓</span>
  ) : (
    <span className="text-soft/40">✗</span>
  )
}

function Th({ children, className }) {
  return (
    <th
      className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body whitespace-nowrap ${className ?? ''}`}
    >
      {children}
    </th>
  )
}

function Td({ children, className }) {
  return (
    <td className={`px-3 py-3 text-sm font-body text-mid align-middle ${className ?? ''}`}>
      {children}
    </td>
  )
}

export function PerformersTab({ performers, seriesId, availablePerformers }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [modalOpen, setModalOpen] = useState(false)
  const [addingPerformer, setAddingPerformer] = useState(false)
  const [addError, setAddError] = useState(null)
  const [addPending, setAddPending] = useState(false)

  async function handleAddPerformer(performerId) {
    setAddPending(true)
    setAddError(null)
    const result = await addPerformerToSeries(performerId, seriesId)
    setAddPending(false)
    if (result?.error) { setAddError(result.error); return }
    setAddingPerformer(false)
    router.refresh()
  }

  return (
    <>
      {/* "Add new contact" still uses the modal (for creating a brand-new performer record) */}
      <AddToSeriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        seriesId={seriesId}
        availablePerformers={[]}
      />

      {performers.length === 0 ? (
        <div className="pt-6">
          <EmptyState
            icon="🎤"
            title="No performers added yet"
            description="Add performers from your database to this series to track bookings."
            className="py-16"
          />
          <div className="flex flex-col items-center mt-4 gap-3 max-w-sm mx-auto">
            {addingPerformer ? (
              <PerformerCombobox
                performers={availablePerformers}
                onSelect={handleAddPerformer}
                onClose={() => { setAddingPerformer(false); setAddError(null) }}
                isPending={addPending}
                error={addError}
              />
            ) : (
              <button
                onClick={() => setAddingPerformer(true)}
                className="inline-flex items-center h-9 px-4 text-sm font-medium font-body rounded-lg
                  bg-coral text-white hover:bg-coral/90 transition-colors"
              >
                + Add performer
              </button>
            )}
            <div className="flex items-center gap-3 text-sm font-body">
              <Link href="/dashboard/performers" className="text-coral hover:underline">
                View full database →
              </Link>
              <span className="text-soft/40">·</span>
              <button onClick={() => setModalOpen(true)} className="text-coral hover:underline">
                Add new contact
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-6 flex flex-col gap-4">
          {/* Actions row */}
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/dashboard/performers"
              className="text-sm text-coral hover:underline font-body"
            >
              View full database →
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="text-sm text-soft hover:text-mid font-body"
              >
                Add new contact
              </button>
              {!addingPerformer && (
                <button
                  onClick={() => { setAddingPerformer(true); setAddError(null) }}
                  className="inline-flex items-center h-9 px-3 text-sm font-medium font-body rounded-lg
                    bg-transparent text-deep border border-mid hover:bg-peach transition-colors"
                >
                  + Add performer
                </button>
              )}
            </div>
          </div>

          {addingPerformer && (
            <PerformerCombobox
              performers={availablePerformers}
              onSelect={handleAddPerformer}
              onClose={() => { setAddingPerformer(false); setAddError(null) }}
              isPending={addPending}
              error={addError}
            />
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-card border border-peach bg-white">
            <table className="min-w-full border-collapse">
              <thead className="border-b border-peach bg-cream/60">
                <tr>
                  <Th>Name</Th>
                  <Th>Type</Th>
                  <Th>Instagram</Th>
                  <Th>Shows</Th>
                  <Th>Last Performed</Th>
                  <Th className="text-center">Book Again</Th>
                  <Th className="text-center">Audience Fav</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peach">
                {performers.map((p) => (
                  <tr key={p.id} className="hover:bg-cream/50 transition-colors">
                    <Td>
                      <span className="font-medium text-deep">{p.name}</span>
                    </Td>
                    <Td>
                      {p.act_type ? (
                        <Pill variant="neutral">{p.act_type}</Pill>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {p.instagram ? (
                        <a
                          href={`https://instagram.com/${p.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-coral hover:underline"
                        >
                          @{p.instagram.replace('@', '')}
                        </a>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-semibold text-deep">{p.showCount}</span>
                    </Td>
                    <Td>
                      {p.lastPerformed ? (
                        formatShortDate(p.lastPerformed)
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td className="text-center">
                      <BoolIcon value={p.book_again} />
                    </Td>
                    <Td className="text-center">
                      <BoolIcon value={p.audience_favourite} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
