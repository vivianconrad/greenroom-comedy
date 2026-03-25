'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons'
import { Modal } from '@/components/atoms/modal'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { importPerformers, fetchSheetAsCSV } from '@/lib/actions/performers'
import { cn } from '@/lib/utils'

// ─── Field definitions ─────────────────────────────────────────────────────────

const FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'pronouns', label: 'Pronouns' },
  { key: 'act_type', label: 'Act type' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'email', label: 'Email' },
  { key: 'contact_method', label: 'Contact method' },
  { key: 'how_we_met', label: 'How we met' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  { key: 'book_again', label: 'Book again' },
  { key: 'audience_favourite', label: 'Audience favourite' },
]

const ALIASES = {
  name: ['name', 'performer', 'performer name', 'full name', 'act name', 'artist', 'comic'],
  pronouns: ['pronouns', 'pronoun'],
  act_type: ['act type', 'acttype', 'type', 'genre', 'style', 'discipline', 'act'],
  instagram: ['instagram', 'ig', 'insta', 'instagram handle', 'ig handle'],
  email: ['email', 'e-mail', 'email address'],
  contact_method: ['contact method', 'contact', 'best way to contact', 'preferred contact', 'contact via'],
  how_we_met: ['how we met', 'met', 'met at', 'origin', 'source', 'how did we meet'],
  notes: ['notes', 'note', 'comments', 'bio', 'additional info', 'additional notes'],
  tags: ['tags', 'tag', 'labels', 'categories'],
  book_again: ['book again', 'bookagain', 'rebook', 'would book again', 'rebook?', 'book?'],
  audience_favourite: [
    'audience fav', 'audience favourite', 'audience favorite',
    'fan favourite', 'crowd favourite', 'audiencefav',
  ],
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function autoDetect(headers) {
  const mapping = {}
  for (const h of headers) {
    const norm = h.toLowerCase().trim()
    let found = 'skip'
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => a === norm)) {
        found = field
        break
      }
    }
    mapping[h] = found
  }
  return mapping
}

function parseBool(val) {
  if (val == null || val === '') return null
  const s = String(val).toLowerCase().trim()
  if (['yes', 'y', 'true', '1', 'x', '✓', '✔'].includes(s)) return true
  if (['no', 'n', 'false', '0'].includes(s)) return false
  return null
}

async function parseFileToRows(file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

async function parseCSVToRows(csvText) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(csvText, { type: 'string' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

function buildPerformers(rawRows, mapping) {
  const [headerRow, ...dataRows] = rawRows
  const performers = []
  for (const row of dataRows) {
    const p = {}
    headerRow.forEach((h, i) => {
      const field = mapping[h]
      if (field && field !== 'skip') p[field] = row[i]
    })
    const name = p.name?.toString().trim()
    if (!name) continue
    performers.push({
      name,
      pronouns: p.pronouns?.toString().trim() || null,
      act_type: p.act_type?.toString().trim() || null,
      instagram: p.instagram?.toString().trim() || null,
      email: p.email?.toString().trim() || null,
      contact_method: p.contact_method?.toString().trim() || null,
      how_we_met: p.how_we_met?.toString().trim() || null,
      notes: p.notes?.toString().trim() || null,
      tags: p.tags?.toString().trim() || null,
      book_again: parseBool(p.book_again),
      audience_favourite: parseBool(p.audience_favourite),
    })
  }
  return performers
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export function ImportPerformersModal({ open, onClose }) {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(1)
  const [rawRows, setRawRows] = useState(null)
  const [mapping, setMapping] = useState({})
  const [sheetUrl, setSheetUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(null)

  function reset() {
    setStep(1)
    setRawRows(null)
    setMapping({})
    setSheetUrl('')
    setLoading(false)
    setError(null)
    setImporting(false)
    setImportedCount(null)
  }

  function handleClose() {
    if (loading || importing) return
    reset()
    onClose()
  }

  function proceedWithRows(rows) {
    if (!rows || rows.length < 2) {
      setError('The file appears to be empty or has no data rows.')
      return
    }
    const headers = rows[0].map((h) => String(h))
    setRawRows([headers, ...rows.slice(1)])
    setMapping(autoDetect(headers))
    setError(null)
    setStep(2)
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      proceedWithRows(await parseFileToRows(file))
    } catch {
      setError('Could not read this file. Please try a .xlsx, .xls, or .csv file.')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  async function handleFetchSheet() {
    if (!sheetUrl.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSheetAsCSV(sheetUrl.trim())
      if (res.error) { setError(res.error); return }
      proceedWithRows(await parseCSVToRows(res.csv))
    } catch (err) {
      setError("Couldn't fetch the sheet. Make sure it's shared as \"Anyone with the link\".")
    } finally {
      setLoading(false)
    }
  }

  const performers = rawRows ? buildPerformers(rawRows, mapping) : []
  const hasNameMapped = Object.values(mapping).includes('name')
  const mappedFields = FIELDS.filter((f) => Object.values(mapping).includes(f.key))
  const skippedRows = rawRows ? rawRows.length - 1 - performers.length : 0

  async function handleImport() {
    setImporting(true)
    setError(null)
    try {
      const res = await importPerformers(performers)
      if (res.error) { setError(res.error); return }
      setImportedCount(res.count)
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Import performers" className="max-w-2xl">

      {/* ── Step 1: Choose source ── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-deep font-body mb-2">Upload a file</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={cn(
                'w-full rounded-card border-2 border-dashed border-peach hover:border-coral',
                'flex flex-col items-center justify-center gap-2 py-10 px-4 transition-colors',
                'text-soft font-body text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <FontAwesomeIcon icon={faArrowUpFromBracket} className="h-8 w-8 text-soft/40" aria-hidden="true" />
              <span>{loading ? 'Reading…' : 'Click to choose a file'}</span>
              <span className="text-xs text-soft/50">.xlsx · .xls · .csv</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-peach" />
            <span className="text-xs text-soft/50 font-body">or</span>
            <div className="flex-1 h-px bg-peach" />
          </div>

          <div>
            <p className="text-sm font-semibold text-deep font-body mb-1">Google Sheets URL</p>
            <p className="text-xs text-soft font-body mb-3">
              The sheet must be shared as "Anyone with the link can view".
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchSheet()}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleFetchSheet}
                loading={loading}
                disabled={!sheetUrl.trim()}
              >
                Load
              </Button>
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}
        </div>
      )}

      {/* ── Step 2: Map columns ── */}
      {step === 2 && rawRows && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-body text-soft">
            Found <span className="font-semibold text-deep">{rawRows.length - 1}</span> rows.
            Match your columns to performer fields:
          </p>

          <div className="rounded-card border border-peach overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-cream/60 border-b border-peach">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">
                    Your column
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">
                    Maps to
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-peach">
                {rawRows[0].map((header) => (
                  <tr key={header} className="hover:bg-cream/30">
                    <td className="px-3 py-2.5 text-sm font-body text-mid">{header}</td>
                    <td className="px-3 py-2">
                      <select
                        value={mapping[header] ?? 'skip'}
                        onChange={(e) =>
                          setMapping((prev) => ({ ...prev, [header]: e.target.value }))
                        }
                        className="text-sm font-body text-deep bg-white border border-peach rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-coral/30"
                      >
                        <option value="skip">Skip</option>
                        {FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>
                            {f.label}{f.required ? ' (required)' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!hasNameMapped && (
            <p className="text-sm text-mid font-body bg-butter/60 rounded-lg px-3 py-2 border border-amber/20">
              Map at least one column to "Name" to continue.
            </p>
          )}

          {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}

          <div className="flex justify-between pt-1">
            <Button variant="ghost" size="md" onClick={() => { setStep(1); setError(null) }}>
              Back
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep(3)}
              disabled={!hasNameMapped}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview + import ── */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          {importedCount != null ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">🎉</p>
              <p className="text-lg font-semibold font-display text-deep">
                Imported {importedCount} performer{importedCount !== 1 ? 's' : ''}
              </p>
              <p className="text-sm font-body text-soft mt-1">
                They're now in your performer database.
              </p>
              <div className="mt-6">
                <Button variant="primary" size="md" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm font-body text-soft">
                Ready to import{' '}
                <span className="font-semibold text-deep">{performers.length}</span>{' '}
                performer{performers.length !== 1 ? 's' : ''}.
                {skippedRows > 0 && (
                  <span className="text-soft/60 ml-1">
                    ({skippedRows} row{skippedRows !== 1 ? 's' : ''} skipped — missing name.)
                  </span>
                )}
              </p>

              {performers.length > 0 && (
                <div className="rounded-card border border-peach overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-cream/60 border-b border-peach">
                      <tr>
                        {mappedFields.map((f) => (
                          <th
                            key={f.key}
                            className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body whitespace-nowrap"
                          >
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-peach">
                      {performers.slice(0, 5).map((p, i) => (
                        <tr key={i}>
                          {mappedFields.map((f) => (
                            <td
                              key={f.key}
                              className="px-3 py-2.5 text-sm font-body text-mid whitespace-nowrap"
                            >
                              {p[f.key] != null && p[f.key] !== ''
                                ? String(p[f.key])
                                : <span className="text-soft/30">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {performers.length > 5 && (
                    <p className="px-3 py-2 text-xs text-soft/50 font-body border-t border-peach">
                      …and {performers.length - 5} more
                    </p>
                  )}
                </div>
              )}

              {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}

              <div className="flex justify-between pt-1">
                <Button variant="ghost" size="md" onClick={() => { setStep(2); setError(null) }}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleImport}
                  loading={importing}
                  disabled={performers.length === 0}
                >
                  Import {performers.length} performer{performers.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
