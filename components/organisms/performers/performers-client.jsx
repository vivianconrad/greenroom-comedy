'use client'

import React, { useState, useTransition, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Pill } from '@/components/atoms/pill'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Modal } from '@/components/atoms/modal'
import { Textarea } from '@/components/atoms/textarea'
import { AddPerformerModal } from '@/components/organisms/performers/add-performer-modal'
import { ImportPerformersModal } from '@/components/organisms/performers/import-performers-modal'
import { SheetSyncSection } from '@/components/organisms/performers/sheet-sync-section'
import { updatePerformer, addPerformerToSeries, removePerformerFromSeries, deletePerformers } from '@/lib/actions/performers'
import { InfoBanner } from '@/components/atoms/info-banner'
import { formatShortDate, cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BoolIcon({ value }) {
  if (value == null) return <span className="text-soft/40">—</span>
  return value ? (
    <span title="Yes">✅</span>
  ) : (
    <span title="No" className="text-soft/40">❌</span>
  )
}

function AudienceFav({ value }) {
  if (!value) return <span className="text-soft/40">—</span>
  return <span title="Audience favourite">⭐</span>
}

function Th({ children, className }) {
  return (
    <th
      className={cn(
        'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, className }) {
  return (
    <td className={cn('px-3 py-3 text-sm font-body text-mid align-middle', className)}>
      {children}
    </td>
  )
}

// ─── Edit Performer Modal ──────────────────────────────────────────────────────

function EditPerformerModal({ open, onClose, performer }) {
  const router = useRouter()
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setErrors({})
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name')?.toString().trim()
    if (!name) {
      setErrors({ name: 'Name is required.' })
      return
    }
    setErrors({})

    startTransition(async () => {
      const result = await updatePerformer(performer.id, formData)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      handleClose()
    })
  }

  if (!performer) return null

  const tagsStr = Array.isArray(performer.tags)
    ? performer.tags.join(', ')
    : performer.tags ?? ''

  return (
    <Modal open={open} onClose={handleClose} title="Edit performer">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Name"
              name="name"
              defaultValue={performer.name}
              error={errors.name}
              autoFocus
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Stage name"
              name="stage_name"
              defaultValue={performer.stage_name ?? ''}
              placeholder="If different from legal name"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Pronouns"
              name="pronouns"
              defaultValue={performer.pronouns ?? ''}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Act type"
              name="act_type"
              defaultValue={performer.act_type ?? ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Instagram"
              name="instagram"
              defaultValue={performer.instagram ?? ''}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={performer.email ?? ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="Best way to contact"
              name="contact_method"
              defaultValue={performer.contact_method ?? ''}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Input
              label="How we met"
              name="how_we_met"
              defaultValue={performer.how_we_met ?? ''}
            />
          </div>
        </div>

        <Input
          label="Clip"
          name="clip_url"
          type="url"
          defaultValue={performer.clip_url ?? ''}
          placeholder="https://…"
        />

        <Textarea
          label="Notes"
          name="notes"
          defaultValue={performer.notes ?? ''}
          maxLength={1000}
        />

        <Input
          label="Tags"
          name="tags"
          defaultValue={tagsStr}
          placeholder="Comma-separated"
        />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-1">
            {errors.form}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────

function DetailPanel({ performer, allSeries, onEdit }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [seriesError, setSeriesError] = useState(null)

  const memberSeriesIds = new Set(performer.series.map((s) => s.id))
  const availableSeries = allSeries.filter((s) => !memberSeriesIds.has(s.id))

  function handleAddToSeries(seriesId) {
    setSeriesError(null)
    startTransition(async () => {
      const result = await addPerformerToSeries(performer.id, seriesId)
      if (result?.error) setSeriesError(result.error)
      else router.refresh()
    })
  }

  function handleRemoveFromSeries(seriesId) {
    setSeriesError(null)
    startTransition(async () => {
      const result = await removePerformerFromSeries(performer.id, seriesId)
      if (result?.error) setSeriesError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="bg-cream/60 border-t border-peach px-4 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* ── Left: profile ── */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold text-deep font-display">{performer.name}</p>
          {performer.stage_name && (
            <p className="text-sm text-mid font-body">"{performer.stage_name}"</p>
          )}
          {performer.pronouns && (
            <p className="text-sm text-soft font-body">{performer.pronouns}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-body">
          {performer.act_type && (
            <>
              <span className="text-soft">Act type</span>
              <span className="text-deep">{performer.act_type}</span>
            </>
          )}
          {performer.clip_url && (
            <>
              <span className="text-soft">Clip</span>
              <a
                href={performer.clip_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline truncate"
              >
                Watch ↗
              </a>
            </>
          )}
          {performer.instagram && (
            <>
              <span className="text-soft">Instagram</span>
              <a
                href={`https://instagram.com/${performer.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline truncate"
              >
                @{performer.instagram.replace('@', '')}
              </a>
            </>
          )}
          {performer.email && (
            <>
              <span className="text-soft">Email</span>
              <a href={`mailto:${performer.email}`} className="text-coral hover:underline truncate">
                {performer.email}
              </a>
            </>
          )}
          {performer.contact_method && (
            <>
              <span className="text-soft">Contact via</span>
              <span className="text-deep">{performer.contact_method}</span>
            </>
          )}
          {performer.how_we_met && (
            <>
              <span className="text-soft">How we met</span>
              <span className="text-deep">{performer.how_we_met}</span>
            </>
          )}
        </div>

        {performer.notes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-1">Notes</p>
            <p className="text-sm text-mid font-body whitespace-pre-wrap">{performer.notes}</p>
          </div>
        )}

        {Array.isArray(performer.tags) && performer.tags.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {performer.tags.map((tag) => (
                <Pill key={tag} variant="neutral">{tag}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: series + actions ── */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-2">Series</p>
          {performer.series.length === 0 ? (
            <p className="text-sm text-soft font-body italic">Not in any series yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {performer.series.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleRemoveFromSeries(s.id)}
                  disabled={isPending}
                  title="Click to remove from series"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium font-body
                    bg-peach text-mid hover:bg-red-bg hover:text-red transition-colors disabled:opacity-50"
                >
                  {s.name}
                  <span aria-hidden className="text-soft/60">×</span>
                </button>
              ))}
            </div>
          )}

          {availableSeries.length > 0 && (
            <div className="mt-2">
              <select
                onChange={(e) => {
                  if (e.target.value) handleAddToSeries(e.target.value)
                  e.target.value = ''
                }}
                disabled={isPending}
                className="text-sm font-body text-coral bg-transparent border-0 underline cursor-pointer
                  focus:outline-none disabled:opacity-50"
                defaultValue=""
              >
                <option value="" disabled>+ Add to series</option>
                {availableSeries.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {seriesError && (
            <p className="text-xs text-red font-body mt-1">{seriesError}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" disabled>
            Book for show
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main client component ─────────────────────────────────────────────────────

export function PerformersClient({ performers, allSeries, sheetSync = null, page = 0, pageSize = 50, total = 0, initialSearch = '', initialSeries = '' }) {
  const router = useRouter()

  // Local search input value — debounced to URL
  const [searchInput, setSearchInput] = useState(initialSearch)
  const debounceRef = useRef(null)

  const [expandedId, setExpandedId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editPerformer, setEditPerformer] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isDeleting, startDeleteTransition] = useTransition()

  const totalPages = Math.ceil(total / pageSize)
  const activeFilter = initialSeries || 'all'

  // ── URL navigation helpers ──────────────────────────────────────────────────

  function buildUrl({ q, series, page: p } = {}) {
    const params = new URLSearchParams()
    const resolvedQ = q !== undefined ? q : initialSearch
    const resolvedSeries = series !== undefined ? series : initialSeries
    const resolvedPage = p !== undefined ? p : page
    if (resolvedQ) params.set('q', resolvedQ)
    if (resolvedSeries) params.set('series', resolvedSeries)
    if (resolvedPage > 0) params.set('page', String(resolvedPage))
    const qs = params.toString()
    return qs ? `/dashboard/performers?${qs}` : '/dashboard/performers'
  }

  function navigate(overrides) {
    router.push(buildUrl(overrides))
  }

  // Debounced search → URL (resets to page 0)
  function handleSearchChange(val) {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: val, page: 0 }))
    }, 350)
  }

  function handleSeriesFilter(seriesId) {
    router.push(buildUrl({ series: seriesId === 'all' ? '' : seriesId, page: 0 }))
  }

  // Derive filter pills: "All" + one per series
  const filterPills = useMemo(() => {
    return [{ key: 'all', label: 'All' }, ...allSeries.map((s) => ({ key: s.id, label: s.name }))]
  }, [allSeries])

  // performers prop is already filtered/paginated from server
  const visible = performers

  const allVisibleIds = useMemo(() => visible.map((p) => p.id), [visible])
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id))
  const someSelected = allVisibleIds.some((id) => selectedIds.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allVisibleIds))
    }
  }

  function toggleSelect(id, e) {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleDeleteSelected() {
    startDeleteTransition(async () => {
      const result = await deletePerformers([...selectedIds])
      if (!result?.error) {
        setSelectedIds(new Set())
        setDeleteConfirm(false)
        router.refresh()
      }
    })
  }

  function toggleRow(id) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      {/* ── Application queue banner (placeholder) ── */}
      <InfoBanner storageKey="performers-applications">
        <span className="font-semibold text-deep">0</span>
        <span className="text-mid"> new applications</span>
      </InfoBanner>

      {/* ── Google Sheet sync + action buttons ── */}
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="md" onClick={() => setImportOpen(true)}>
            Import
          </Button>
          <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
            + Add performer
          </Button>
        </div>
        <div className="flex-1">
          <SheetSyncSection initialSync={sheetSync} entityType="performers" />
        </div>
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name…"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => handleSeriesFilter(pill.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium font-body transition-colors',
                activeFilter === pill.key
                  ? 'bg-coral text-white'
                  : 'bg-peach text-mid hover:bg-peach/70'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk action toolbar ── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-butter border border-amber/30 rounded-card text-sm font-body">
          <span className="text-mid font-medium">
            {selectedIds.size} {selectedIds.size === 1 ? 'performer' : 'performers'} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" disabled>
              Book for show
            </Button>
            {deleteConfirm ? (
              <>
                <span className="text-mid text-xs">Delete {selectedIds.size}?</span>
                <Button variant="danger" size="sm" onClick={handleDeleteSelected} loading={isDeleting}>
                  Confirm
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)} disabled={isDeleting}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-soft font-body text-sm">
          {searchInput || activeFilter !== 'all'
            ? 'No performers match your search.'
            : 'No performers yet — add one to get started.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-peach bg-white">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-peach bg-cream/60">
              <tr>
                <th className="px-3 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={toggleSelectAll}
                    onClick={(e) => e.stopPropagation()}
                    className="cursor-pointer accent-coral"
                  />
                </th>
                <Th>Name</Th>
                <Th>Act Type</Th>
                <Th>Instagram</Th>
                <Th>Clip</Th>
                <Th>Series</Th>
                <Th>Shows</Th>
                <Th>Last Performed</Th>
                <Th className="text-center">Book Again</Th>
                <Th className="text-center">Audience Fav</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach">
              {visible.map((p) => (
                <React.Fragment key={p.id}>
                  <tr
                    onClick={() => toggleRow(p.id)}
                    className={cn(
                      'hover:bg-cream/50 transition-colors cursor-pointer select-none',
                      selectedIds.has(p.id) && 'bg-butter/60'
                    )}
                  >
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={(e) => toggleSelect(p.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-pointer accent-coral"
                      />
                    </Td>
                    <Td>
                      <div>
                        <span className="font-medium text-deep">{p.name}</span>
                        {p.pronouns && (
                          <span className="block text-xs text-soft/70">{p.pronouns}</span>
                        )}
                      </div>
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
                          onClick={(e) => e.stopPropagation()}
                          className="text-coral hover:underline"
                        >
                          @{p.instagram.replace('@', '')}
                        </a>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {p.clip_url ? (
                        <a
                          href={p.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-coral hover:underline text-sm"
                        >
                          Watch ↗
                        </a>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {p.series.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.series.map((s) => (
                            <Pill key={s.id} variant="info">{s.name}</Pill>
                          ))}
                        </div>
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
                      <AudienceFav value={p.audience_favourite} />
                    </Td>
                  </tr>

                  {expandedId === p.id && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={10} className="p-0">
                        <DetailPanel
                          performer={p}
                          allSeries={allSeries}
                          onEdit={() => setEditPerformer(p)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm font-body text-soft">
          <span>
            {totalPages > 1
              ? <>{page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of <span className="font-semibold text-deep">{total}</span></>
              : <><span className="font-semibold text-deep">{total}</span> {total === 1 ? 'performer' : 'performers'}</>
            }
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate({ page: 0 })}
                disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-peach disabled:opacity-30 disabled:cursor-default transition-colors"
                title="First page"
              >
                ««
              </button>
              <button
                onClick={() => navigate({ page: page - 1 })}
                disabled={page === 0}
                className="px-2 py-1 rounded hover:bg-peach disabled:opacity-30 disabled:cursor-default transition-colors"
                title="Previous page"
              >
                ‹ Prev
              </button>
              <span className="px-3 text-mid">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => navigate({ page: page + 1 })}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-peach disabled:opacity-30 disabled:cursor-default transition-colors"
                title="Next page"
              >
                Next ›
              </button>
              <button
                onClick={() => navigate({ page: totalPages - 1 })}
                disabled={page >= totalPages - 1}
                className="px-2 py-1 rounded hover:bg-peach disabled:opacity-30 disabled:cursor-default transition-colors"
                title="Last page"
              >
                »»
              </button>
            </div>
          )}
        </div>
      )}

      <AddPerformerModal open={addOpen} onClose={() => setAddOpen(false)} />
      <ImportPerformersModal open={importOpen} onClose={() => setImportOpen(false)} />
      <EditPerformerModal
        open={!!editPerformer}
        onClose={() => setEditPerformer(null)}
        performer={editPerformer}
      />
    </>
  )
}
