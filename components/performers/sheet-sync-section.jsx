'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchSheetAsCSV } from '@/lib/actions/performers'
import { saveSheetSync, deleteSheetSync, runSheetSync } from '@/lib/actions/sheet-sync'
import { cn } from '@/lib/utils'

// ─── Shared column definitions (mirrors ImportPerformersModal) ─────────────────

const FIELDS = [
  { key: 'name',              label: 'Name',               required: true },
  { key: 'pronouns',          label: 'Pronouns' },
  { key: 'act_type',          label: 'Act type' },
  { key: 'instagram',         label: 'Instagram' },
  { key: 'email',             label: 'Email' },
  { key: 'contact_method',    label: 'Contact method' },
  { key: 'how_we_met',        label: 'How we met' },
  { key: 'notes',             label: 'Notes' },
  { key: 'tags',              label: 'Tags' },
  { key: 'book_again',        label: 'Book again' },
  { key: 'audience_favourite', label: 'Audience favourite' },
]

const ALIASES = {
  name:               ['name', 'performer', 'performer name', 'full name', 'act name', 'artist', 'comic'],
  pronouns:           ['pronouns', 'pronoun'],
  act_type:           ['act type', 'acttype', 'type', 'genre', 'style', 'discipline', 'act'],
  instagram:          ['instagram', 'ig', 'insta', 'instagram handle', 'ig handle'],
  email:              ['email', 'e-mail', 'email address'],
  contact_method:     ['contact method', 'contact', 'best way to contact', 'preferred contact', 'contact via'],
  how_we_met:         ['how we met', 'met', 'met at', 'origin', 'source', 'how did we meet'],
  notes:              ['notes', 'note', 'comments', 'bio', 'additional info', 'additional notes'],
  tags:               ['tags', 'tag', 'labels', 'categories'],
  book_again:         ['book again', 'bookagain', 'rebook', 'would book again', 'rebook?', 'book?'],
  audience_favourite: ['audience fav', 'audience favourite', 'audience favorite', 'fan favourite', 'crowd favourite'],
}

function autoDetect(headers) {
  const mapping = {}
  for (const h of headers) {
    const norm = h.toLowerCase().trim()
    let found = 'skip'
    for (const [field, aliases] of Object.entries(ALIASES)) {
      if (aliases.some((a) => a === norm)) { found = field; break }
    }
    mapping[h] = found
  }
  return mapping
}

async function parseCSVToRows(csvText) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(csvText, { type: 'string' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SyncStatus({ sync, onSync, onDisconnect, syncing, disconnecting }) {
  const lastSynced = sync.last_synced_at
    ? new Date(sync.last_synced_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'Never'

  const shortUrl = sync.sheet_url.replace(/^https?:\/\/docs\.google\.com\/spreadsheets\/d\//, '').slice(0, 30) + '…'

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-card border border-peach">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-2 h-2 rounded-full bg-sage shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-deep font-body truncate">
            Google Sheet connected
          </p>
          <p className="text-xs text-soft font-body mt-0.5">
            Last synced: {lastSynced}
            {sync.sync_count > 0 && ` · ${sync.sync_count} sync${sync.sync_count !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="primary" size="sm" onClick={onSync} loading={syncing} disabled={syncing || disconnecting}>
          Sync now
        </Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect} loading={disconnecting} disabled={syncing || disconnecting}>
          Disconnect
        </Button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * @param {object|null} initialSync  — existing sheet_syncs row, or null
 * @param {'performers'} entityType
 * @param {string|null}  seriesId
 */
export function SheetSyncSection({ initialSync, entityType = 'performers', seriesId = null }) {
  const router = useRouter()

  const [sync, setSync] = useState(initialSync)
  const [open, setOpen] = useState(false)

  // Wizard state
  const [step, setStep] = useState(1)
  const [sheetUrl, setSheetUrl] = useState('')
  const [headers, setHeaders] = useState(null)
  const [mapping, setMapping] = useState({})
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [syncResult, setSyncResult] = useState(null)

  // Pending states
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [, startSave] = useTransition()
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  function resetWizard() {
    setStep(1)
    setSheetUrl('')
    setHeaders(null)
    setMapping({})
    setLoadError(null)
    setSaveError(null)
    setSyncResult(null)
  }

  async function handleLoadSheet() {
    if (!sheetUrl.trim()) return
    setLoadingSheet(true)
    setLoadError(null)
    try {
      const res = await fetchSheetAsCSV(sheetUrl.trim())
      if (res.error) { setLoadError(res.error); return }
      const rows = await parseCSVToRows(res.csv)
      if (!rows?.length) { setLoadError('Sheet appears empty.'); return }
      const hdrs = rows[0].map((h) => String(h))
      setHeaders(hdrs)
      setMapping(autoDetect(hdrs))
      setStep(2)
    } catch {
      setLoadError("Couldn't load the sheet. Make sure it's shared as \"Anyone with the link\".")
    } finally {
      setLoadingSheet(false)
    }
  }

  function handleSaveAndSync() {
    setSaveError(null)
    startSave(async () => {
      const saveRes = await saveSheetSync({
        entityType,
        seriesId,
        sheetUrl: sheetUrl.trim(),
        columnMapping: mapping,
      })
      if (saveRes.error) { setSaveError(saveRes.error); return }

      // Run initial sync immediately
      const syncRes = await runSheetSync(saveRes.id)
      if (syncRes.error) { setSaveError(syncRes.error); return }

      setSyncResult(syncRes)
      setStep(3)
      router.refresh()
    })
  }

  async function handleSync() {
    if (!sync) return
    setSyncing(true)
    try {
      const res = await runSheetSync(sync.id)
      if (res.error) { alert(res.error); return }
      router.refresh()
      // Refresh local sync state from server
      setSync((prev) => ({ ...prev, last_synced_at: new Date().toISOString(), sync_count: (prev.sync_count ?? 0) + 1 }))
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!sync) return
    setDisconnecting(true)
    try {
      await deleteSheetSync(sync.id)
      setSync(null)
      router.refresh()
    } finally {
      setDisconnecting(false)
    }
  }

  function handleConnectDone() {
    resetWizard()
    setOpen(false)
    // sync state was set by server refresh
    router.refresh()
  }

  const hasNameMapped = Object.values(mapping).includes('name')

  // ── Render ──────────────────────────────────────────────────────────────────

  if (sync) {
    return (
      <SyncStatus
        sync={sync}
        onSync={handleSync}
        onDisconnect={handleDisconnect}
        syncing={syncing}
        disconnecting={disconnecting}
      />
    )
  }

  return (
    <div className="rounded-card border border-peach bg-white">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (!open) resetWizard() }}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-deep font-body">Sync from Google Sheets</span>
          <span className="text-xs text-soft font-body">Keep your performer list up to date automatically</span>
        </div>
        <span className="text-soft text-sm select-none">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-peach px-4 pb-4 pt-3">

          {/* Step 1: Enter sheet URL */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-soft font-body">
                The sheet must be shared as <strong>"Anyone with the link can view"</strong>.
              </p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadSheet()}
                  />
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleLoadSheet}
                  loading={loadingSheet}
                  disabled={!sheetUrl.trim()}
                >
                  Load
                </Button>
              </div>
              {loadError && <p className="text-sm text-red font-body">{loadError}</p>}
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === 2 && headers && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-soft font-body">
                Map your sheet columns to performer fields. Syncs will update existing performers by name and add new ones.
              </p>

              <div className="rounded-card border border-peach overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-cream/60 border-b border-peach">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">Sheet column</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-soft/70 font-body">Maps to</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-peach">
                    {headers.map((h) => (
                      <tr key={h} className="hover:bg-cream/30">
                        <td className="px-3 py-2.5 text-sm font-body text-mid">{h}</td>
                        <td className="px-3 py-2">
                          <select
                            value={mapping[h] ?? 'skip'}
                            onChange={(e) => setMapping((prev) => ({ ...prev, [h]: e.target.value }))}
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

              {saveError && <p className="text-sm text-red font-body">{saveError}</p>}

              <div className="flex justify-between">
                <Button variant="ghost" size="md" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" size="md" onClick={handleSaveAndSync} disabled={!hasNameMapped}>
                  Connect &amp; sync
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && syncResult && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-2xl">✓</p>
              <p className="text-base font-semibold font-display text-deep">Sheet connected</p>
              {(syncResult.inserted > 0 || syncResult.updated > 0) && (
                <p className="text-sm text-soft font-body">
                  {[
                    syncResult.inserted > 0 && `${syncResult.inserted} added`,
                    syncResult.updated > 0 && `${syncResult.updated} updated`,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
              <Button variant="primary" size="sm" onClick={handleConnectDone}>Done</Button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
