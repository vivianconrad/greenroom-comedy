'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, fillTemplate } from '@/lib/utils'
import { useCopyToClipboard } from '@/lib/hooks'
import { logMessageSent, sendEmailComm } from '@/lib/actions/comms'
import { Button } from '@/components/atoms/button'
import { EmptyState } from '@/components/atoms/empty-state'

// ─── Recipient group definitions ──────────────────────────────────────────────

const GROUPS = [
  { key: 'everyone',   label: 'Everyone' },
  { key: 'performers', label: 'All Performers' },
  { key: 'hosts',      label: 'Hosts Only' },
  { key: 'tech',       label: 'Tech & Camera' },
  { key: 'custom',     label: 'Custom' },
]

const TECH_ROLES = new Set(['tech', 'camera', 'sound', 'lighting', 'av', 'stage_manager'])

function computeRecipients(group, customSelected, recipientGroups) {
  const performers = recipientGroups?.performers ?? []
  const crew = recipientGroups?.crew ?? []

  switch (group) {
    case 'everyone':
      return [...performers, ...crew]
    case 'performers':
      return performers
    case 'hosts':
      return performers.filter((p) => p.role === 'host')
    case 'tech':
      return [
        ...crew.filter((c) => TECH_ROLES.has(c.role)),
        ...performers.filter((p) => TECH_ROLES.has(p.role)),
      ]
    case 'custom':
      return [...performers, ...crew].filter((p) => customSelected.has(p.id))
    default:
      return performers
  }
}

// ─── Recipient chip ───────────────────────────────────────────────────────────

function RecipientChip({ person }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-peach rounded text-xs font-body text-mid">
      {person.name}
      {person.instagram && (
        <span className="text-soft/70">@{person.instagram}</span>
      )}
      {person.type === 'crew' && (
        <span className="text-soft/70 italic">{person.role}</span>
      )}
    </span>
  )
}

// ─── Sent log entry ───────────────────────────────────────────────────────────

function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false)

  const sentDate = new Date(entry.sent_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-white rounded-card border border-peach p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {entry.subject && (
              <span className="text-sm font-semibold text-deep font-body">{entry.subject}</span>
            )}
            <span className="text-xs text-soft font-body">
              → {entry.recipient_group}
              {(entry.recipient_names?.length ?? 0) > 0 && ` (${entry.recipient_names.length})`}
            </span>
          </div>
          <p className="text-xs text-soft font-body mt-0.5">{sentDate}</p>
          {!expanded && (
            <p className="text-sm text-mid font-body mt-1 line-clamp-2">{entry.body}</p>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-xs text-coral hover:underline font-body"
        >
          {expanded ? 'Collapse' : 'View'}
        </button>
      </div>
      {expanded && (
        <p className="text-sm text-deep font-body whitespace-pre-wrap leading-relaxed mt-3 pt-3 border-t border-peach">
          {entry.body}
        </p>
      )}
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export function CommsTab({ show, commLog = [], recipientGroups = {}, preset = null }) {
  const router = useRouter()
  const [group, setGroup] = useState(preset?.group ?? 'performers')
  const [customSelected, setCustomSelected] = useState(new Set())
  const [templateId, setTemplateId] = useState(preset?.template ?? '')
  const [activeTag, setActiveTag] = useState(null)
  const [body, setBody] = useState('')
  const [copied, copy] = useCopyToClipboard()
  const [sending, startSend] = useTransition()
  const [emailing, startEmail] = useTransition()
  const [sentError, setSentError] = useState(null)
  const [sentNotice, setSentNotice] = useState(null)

  const allPeople = [
    ...(recipientGroups.performers ?? []),
    ...(recipientGroups.crew ?? []),
  ]
  const recipients = computeRecipients(group, customSelected, recipientGroups)

  // Tag filter state for template selector
  const allTags = [...new Set((show.commTemplates ?? []).flatMap((t) => t.tags ?? []))].sort()
  const visibleTemplates = activeTag
    ? (show.commTemplates ?? []).filter((t) => t.tags?.includes(activeTag))
    : (show.commTemplates ?? [])

  // Fill body when template is selected
  useEffect(() => {
    if (!templateId) return
    const tmpl = (show.commTemplates ?? []).find((t) => t.id === templateId)
    if (tmpl) setBody(fillTemplate(tmpl.body, show))
  }, [templateId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleGroupChange(key) {
    setGroup(key)
    if (key !== 'custom') setCustomSelected(new Set())
  }

  function toggleCustomPerson(id) {
    setCustomSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSendEmail() {
    if (!body.trim()) return
    setSentError(null)
    setSentNotice(null)
    const tmpl = templateId
      ? (show.commTemplates ?? []).find((t) => t.id === templateId)
      : null
    const groupLabel =
      group === 'custom'
        ? `Custom (${recipients.length})`
        : GROUPS.find((g) => g.key === group)?.label ?? group
    const emailRecipients = recipients
      .filter((r) => r.email)
      .map((r) => ({ name: r.name, email: r.email }))

    startEmail(async () => {
      const result = await sendEmailComm(show.id, emailRecipients, {
        subject: tmpl?.name ?? '',
        body: body.trim(),
        recipient_group: groupLabel,
      })
      if (result?.error) {
        setSentError(result.error)
        return
      }
      setSentNotice(
        result.warning ?? `Sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}.`
      )
      setBody('')
      setTemplateId('')
      router.refresh()
    })
  }

  function handleMarkSent() {
    if (!body.trim()) return
    setSentError(null)
    startSend(async () => {
      const tmpl = templateId
        ? (show.commTemplates ?? []).find((t) => t.id === templateId)
        : null
      const groupLabel =
        group === 'custom'
          ? `Custom (${recipients.length})`
          : GROUPS.find((g) => g.key === group)?.label ?? group

      const result = await logMessageSent(show.id, {
        recipient_group: groupLabel,
        recipient_names: recipients.map((r) => r.name),
        subject: tmpl?.name ?? null,
        body: body.trim(),
      })
      if (result?.error) {
        setSentError(result.error)
        return
      }
      setBody('')
      setTemplateId('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-10 max-w-2xl pt-2">
      {/* ── Compose ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-soft mb-5">
          Compose
        </h2>

        {/* Recipient group selector */}
        <div className="mb-5">
          <p className="text-sm font-medium text-soft font-body mb-2">To</p>
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => handleGroupChange(g.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-body font-medium border transition-colors',
                  group === g.key
                    ? 'bg-coral text-cream border-coral'
                    : 'bg-white text-mid border-peach hover:bg-peach hover:text-deep'
                )}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Custom people picker */}
          {group === 'custom' && allPeople.length > 0 && (
            <div className="mt-3 p-3 bg-cream rounded-card border border-peach">
              <p className="text-xs font-semibold text-soft font-body mb-2">Select recipients</p>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {allPeople.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customSelected.has(p.id)}
                      onChange={() => toggleCustomPerson(p.id)}
                      className="accent-coral shrink-0"
                    />
                    <span className="text-sm font-body text-deep">{p.name}</span>
                    <span className="text-xs font-body text-soft capitalize">{p.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Recipients preview */}
          <div className="mt-2 min-h-6">
            {recipients.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <RecipientChip key={r.id} person={r} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-soft/70 font-body">No recipients in this group.</p>
            )}
          </div>
        </div>

        {/* Template selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-soft font-body block mb-2">
            Template
          </label>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <button
                onClick={() => setActiveTag(null)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-xs font-body font-medium transition-colors',
                  !activeTag ? 'bg-lav text-white' : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
                )}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-body font-medium transition-colors',
                    activeTag === tag ? 'bg-lav text-white' : 'bg-lav-bg text-lav border border-lav/20 hover:bg-lav/15'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full h-10 rounded-lg border border-peach bg-white px-3 text-sm font-body text-deep focus:outline-none focus:ring-2 focus:ring-coral/30"
          >
            <option value="">— Write from scratch —</option>
            {visibleTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {(show.commTemplates ?? []).length === 0 && (
            <p className="text-xs text-soft font-body mt-1">
              Add templates in the series Comms tab to re-use them here.
            </p>
          )}
        </div>

        {/* Message body */}
        <div className="mb-5">
          <label className="text-sm font-medium text-soft font-body block mb-2">
            Message
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message, or pick a template above…&#10;&#10;Variables: [date] [venue] [showTime] [doors] [callTime] [theme] [runningOrder] [ticketUrl] [promoCode]&#10;[name] is left as-is — a reminder to personalise each copy."
            rows={9}
            className="w-full rounded-card border border-peach bg-white px-4 py-3 text-sm font-body text-deep leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>

        {sentError && (
          <p role="alert" className="text-sm text-red font-body mb-3">
            {sentError}
          </p>
        )}
        {sentNotice && (
          <p className="text-sm text-green font-body mb-3">{sentNotice}</p>
        )}

        <div className="flex gap-3 flex-wrap">
          <Button
            variant="primary"
            size="md"
            onClick={() => copy(body)}
            disabled={!body.trim()}
          >
            {copied ? '✓ Copied!' : 'Copy to clipboard'}
          </Button>
          {recipients.some((r) => r.email) && (
            <Button
              variant="secondary"
              size="md"
              loading={emailing}
              onClick={handleSendEmail}
              disabled={!body.trim() || emailing}
            >
              Send email
              {recipients.filter((r) => r.email).length < recipients.length && (
                <span className="ml-1 opacity-60 text-xs">
                  ({recipients.filter((r) => r.email).length}/{recipients.length})
                </span>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="md"
            loading={sending}
            onClick={handleMarkSent}
            disabled={!body.trim()}
          >
            Mark as sent
          </Button>
        </div>
        <p className="text-xs text-soft font-body mt-2">
          {recipients.some((r) => r.email)
            ? 'Send email delivers directly and logs automatically. Or copy and paste manually.'
            : 'Copy the message, paste into your DMs or group chat, then hit "Mark as sent" to log it.'}
        </p>
      </section>

      {/* ── Sent messages ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-soft mb-4">
          Sent Messages
        </h2>
        {commLog.length === 0 ? (
          <p className="text-sm text-soft font-body">No messages logged for this show yet.</p>
        ) : (
          <div className="space-y-3">
            {commLog.map((entry) => (
              <LogEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
