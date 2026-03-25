'use client'

import React, { useState, useTransition, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAddressBook } from '@fortawesome/free-solid-svg-icons'
import { Pill } from '@/components/atoms/pill'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Modal } from '@/components/atoms/modal'
import { Textarea } from '@/components/atoms/textarea'
import { Select } from '@/components/atoms/select'
import { createPerformerFromContact } from '@/lib/actions/performers'
import { addContactToSeries } from '@/lib/actions/series'
import { CONTACT_ROLES } from '@/components/organisms/series/info-tab'
import { cn } from '@/lib/utils'

// ─── Add Contact Modal ────────────────────────────────────────────────────────

function AddContactModal({ open, onClose, allSeries }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState({})
  const [roleSelect, setRoleSelect] = useState('')
  const [customRole, setCustomRole] = useState('')

  const isOther = roleSelect === 'Other'

  function handleClose() {
    if (isPending) return
    setErrors({})
    setRoleSelect('')
    setCustomRole('')
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = fd.get('name')?.toString().trim()
    const seriesId = fd.get('series_id')?.toString()
    const role = isOther ? customRole.trim() : roleSelect

    if (!name) { setErrors({ name: 'Name is required.' }); return }
    if (!seriesId) { setErrors({ form: 'Please select a series.' }); return }
    setErrors({})

    startTransition(async () => {
      const result = await addContactToSeries(seriesId || null, {
        name,
        role: role || null,
        phone: fd.get('phone')?.toString().trim(),
        email: fd.get('email')?.toString().trim(),
        notes: fd.get('notes')?.toString().trim(),
      })
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add contact">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label className="text-sm font-medium text-soft font-body mb-1.5 block">Series</label>
          <select
            name="series_id"
            defaultValue=""
            required
            className="w-full rounded-lg border border-peach bg-cream px-3.5 py-2.5 text-sm text-deep font-body focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent hover:border-soft transition-colors"
          >
            <option value="" disabled>Select a series…</option>
            {allSeries.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <Input label="Name" name="name" error={errors.name} autoFocus required />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Role"
            value={roleSelect}
            onChange={(e) => setRoleSelect(e.target.value)}
            options={CONTACT_ROLES}
            placeholder="Select a role…"
          />
          <Input label="Phone" name="phone" type="tel" />
        </div>

        {isOther && (
          <Input
            label="Custom role"
            value={customRole}
            onChange={(e) => setCustomRole(e.target.value)}
            placeholder="e.g. Lighting Tech, Security"
          />
        )}

        <Input label="Email" name="email" type="email" />

        <Textarea label="Notes" name="notes" maxLength={500} />

        {errors.form && (
          <p role="alert" className="text-sm text-red font-body -mt-1">{errors.form}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>
            Add contact
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Detail panel: JSONB contact ──────────────────────────────────────────────

function ContactDetailPanel({ row }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  function handleAddAsPerformer() {
    startTransition(async () => {
      const result = await createPerformerFromContact({
        name: row.name,
        email: row.email,
        instagram: row.instagram,
      })
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="bg-cream/60 border-t border-peach px-4 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Left: details */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold text-deep font-display">{row.name}</p>
          {row.role && <p className="text-sm text-soft font-body">{row.role}</p>}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-body">
          {row.email && (
            <>
              <span className="text-soft">Email</span>
              <a href={`mailto:${row.email}`} className="text-coral hover:underline truncate">
                {row.email}
              </a>
            </>
          )}
          {row.phone && (
            <>
              <span className="text-soft">Phone</span>
              <a href={`tel:${row.phone}`} className="text-coral hover:underline truncate">
                {row.phone}
              </a>
            </>
          )}
          {row.seriesName && (
            <>
              <span className="text-soft">Series</span>
              <Link
                href={`/dashboard/series/${row.seriesId}?tab=general`}
                className="text-coral hover:underline truncate"
              >
                {row.seriesName}
              </Link>
            </>
          )}
        </div>
        {row.notes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-1">Notes</p>
            <p className="text-sm text-mid font-body whitespace-pre-wrap">{row.notes}</p>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">Actions</p>
        {done ? (
          <p className="text-sm font-body text-green">Added to performers ✓</p>
        ) : (
          <div className="flex flex-col gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddAsPerformer}
              loading={pending}
              className="w-fit"
            >
              Add as performer
            </Button>
            {error && <p className="text-xs text-red font-body">{error}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Detail panel: Performer ───────────────────────────────────────────────────

function PerformerDetailPanel({ row }) {
  return (
    <div className="bg-cream/60 border-t border-peach px-4 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* Left: profile */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-lg font-semibold text-deep font-display">{row.name}</p>
          {row.stage_name && (
            <p className="text-sm text-mid font-body">"{row.stage_name}"</p>
          )}
          {row.pronouns && (
            <p className="text-sm text-soft font-body">{row.pronouns}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-body">
          {row.act_type && (
            <>
              <span className="text-soft">Act type</span>
              <span className="text-deep">{row.act_type}</span>
            </>
          )}
          {row.instagram && (
            <>
              <span className="text-soft">Instagram</span>
              <a
                href={`https://instagram.com/${row.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline truncate"
              >
                @{row.instagram.replace('@', '')}
              </a>
            </>
          )}
          {row.email && (
            <>
              <span className="text-soft">Email</span>
              <a href={`mailto:${row.email}`} className="text-coral hover:underline truncate">
                {row.email}
              </a>
            </>
          )}
          {row.contact_method && (
            <>
              <span className="text-soft">Contact via</span>
              <span className="text-deep">{row.contact_method}</span>
            </>
          )}
        </div>
      </div>

      {/* Right: series + link */}
      <div className="flex flex-col gap-3">
        {row.series?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-soft/70 font-body mb-2">Series</p>
            <div className="flex flex-wrap gap-1.5">
              {row.series.map((s) => (
                <Pill key={s.id} variant="info">{s.name}</Pill>
              ))}
            </div>
          </div>
        )}
        <div className="mt-auto pt-2">
          <Link href="/dashboard/performers">
            <Button variant="ghost" size="sm">View in performers →</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ContactsPage({ contacts, performers, allSeries }) {
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)

  function handleSearchChange(val) {
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(val), 250)
  }

  // Build unified row list
  const allRows = useMemo(() => {
    const performerRows = performers.map((p) => ({
      _type: 'performer',
      _key: `performer-${p.id}`,
      id: p.id,
      name: p.name,
      stage_name: p.stage_name,
      pronouns: p.pronouns,
      act_type: p.act_type,
      email: p.email,
      instagram: p.instagram,
      contact_method: p.contact_method,
      series: p.series ?? [],
      // unified display fields
      typeLabel: 'Performer',
      contactInfo: p.email || (p.instagram ? `@${p.instagram.replace('@', '')}` : null),
      seriesLabel: (p.series ?? []).map((s) => s.name).join(', '),
    }))

    const contactRows = contacts.map((c) => ({
      _type: 'contact',
      _key: `contact-${c.id}`,
      id: c.id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      instagram: c.instagram,
      seriesId: c.seriesId,
      seriesName: c.seriesName,
      series: c.seriesId ? [{ id: c.seriesId, name: c.seriesName }] : [],
      // unified display fields
      typeLabel: c.role || null,
      contactInfo: c.email || c.phone || null,
      seriesLabel: c.seriesName || '',
    }))

    return [...performerRows, ...contactRows]
  }, [performers, contacts])

  const filterPills = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: 'performers', label: 'Performers' },
    { key: 'contacts', label: 'Contacts' },
    ...allSeries.map((s) => ({ key: `series:${s.id}`, label: s.name })),
  ], [allSeries])

  const visible = useMemo(() => {
    let rows = allRows

    if (filter === 'performers') {
      rows = rows.filter((r) => r._type === 'performer')
    } else if (filter === 'contacts') {
      rows = rows.filter((r) => r._type === 'contact')
    } else if (filter.startsWith('series:')) {
      const sid = filter.replace('series:', '')
      rows = rows.filter((r) => r.series.some((s) => s.id === sid))
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      rows = rows.filter((r) => r.name?.toLowerCase().includes(q))
    }

    return rows
  }, [allRows, filter, search])

  if (allRows.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <FontAwesomeIcon icon={faAddressBook} className="h-10 w-10 text-soft/30" />
          <p className="text-sm font-body text-soft">No contacts yet.</p>
          {allSeries.length > 0 ? (
            <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
              + Add contact
            </Button>
          ) : (
            <p className="text-xs font-body text-soft/70">
              Create a series first, then add contacts here.
            </p>
          )}
        </div>
        <AddContactModal open={addOpen} onClose={() => setAddOpen(false)} allSeries={allSeries} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Add button + Search + filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
          + Add contact
        </Button>
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
              onClick={() => setFilter(pill.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium font-body transition-colors',
                filter === pill.key
                  ? 'bg-coral text-white'
                  : 'bg-peach text-mid hover:bg-peach/70'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-soft font-body text-sm">
          No contacts match your search.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-peach bg-white">
          <table className="min-w-full border-collapse">
            <thead className="border-b border-peach bg-cream/60">
              <tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Email</Th>
                <Th>Phone / Instagram</Th>
                <Th>Series</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-peach">
              {visible.map((row) => (
                <React.Fragment key={row._key}>
                  <tr
                    onClick={() => setExpandedId((prev) => (prev === row._key ? null : row._key))}
                    className="hover:bg-cream/50 transition-colors cursor-pointer select-none"
                  >
                    <Td>
                      <span className="font-medium text-deep">{row.name || '—'}</span>
                      {row.stage_name && (
                        <span className="block text-xs text-soft/70">"{row.stage_name}"</span>
                      )}
                    </Td>
                    <Td>
                      {row._type === 'performer' ? (
                        <Pill variant="info">Performer</Pill>
                      ) : row.typeLabel ? (
                        <span className="text-xs font-body text-soft bg-peach px-2 py-0.5 rounded-full">
                          {row.typeLabel}
                        </span>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {row.email ? (
                        <a
                          href={`mailto:${row.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-coral hover:underline"
                        >
                          {row.email}
                        </a>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {row._type === 'performer' && row.instagram ? (
                        <a
                          href={`https://instagram.com/${row.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-coral hover:underline"
                        >
                          @{row.instagram.replace('@', '')}
                        </a>
                      ) : row._type === 'contact' && row.phone ? (
                        <a
                          href={`tel:${row.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-coral hover:underline"
                        >
                          {row.phone}
                        </a>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                    <Td>
                      {row.series.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.series.map((s) => (
                            <Pill key={s.id} variant="neutral">{s.name}</Pill>
                          ))}
                        </div>
                      ) : (
                        <span className="text-soft/40">—</span>
                      )}
                    </Td>
                  </tr>

                  {expandedId === row._key && (
                    <tr key={`${row._key}-detail`}>
                      <td colSpan={5} className="p-0">
                        {row._type === 'performer' ? (
                          <PerformerDetailPanel row={row} />
                        ) : (
                          <ContactDetailPanel row={row} />
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddContactModal open={addOpen} onClose={() => setAddOpen(false)} allSeries={allSeries} />
    </div>
  )
}
