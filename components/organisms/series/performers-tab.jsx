'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Pill } from '@/components/atoms/pill'
import { EmptyState } from '@/components/atoms/empty-state'
import { AddToSeriesModal } from './add-to-series-modal'
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
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <AddToSeriesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        seriesId={seriesId}
        availablePerformers={availablePerformers}
      />

      {performers.length === 0 ? (
        <div className="pt-6">
          <EmptyState
            icon="🎤"
            title="No performers added yet"
            description="Add performers from your database to this series to track bookings."
            className="py-16"
          />
          <div className="flex justify-center mt-4 gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center h-9 px-4 text-sm font-medium font-body rounded-lg
                bg-coral text-white hover:bg-coral/90 transition-colors"
            >
              + Add performer
            </button>
            <Link
              href="/dashboard/performers"
              className="text-sm text-coral hover:underline font-body self-center"
            >
              View full database →
            </Link>
          </div>
        </div>
      ) : (
        <div className="pt-6 flex flex-col gap-4">
          {/* Actions row */}
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/performers"
              className="text-sm text-coral hover:underline font-body"
            >
              View full database →
            </Link>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center h-9 px-3 text-sm font-medium font-body rounded-lg
                bg-transparent text-deep border border-mid hover:bg-peach transition-colors"
            >
              + Add performer
            </button>
          </div>

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
