'use client'

import { useState, useEffect, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDate, formatTime, timeToMinutes, minutesToTime, fillTemplate } from '@/lib/utils'
import { useCopyToClipboard } from '@/lib/hooks'
import { toggleChecklistItem } from '@/lib/actions/show'
import { toggleDutyCompleted } from '@/lib/actions/duties'

// ─── Color bars by act_type ───────────────────────────────────────────────────

const ACT_COLORS = {
  opening:   'bg-peach',
  host:      'bg-lav-bg',
  performer: 'bg-sage-bg',
  headliner: 'bg-coral/60',
  game:      'bg-butter',
  close:     'bg-peach',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildRunOfShow(performers, showTime) {
  if (!showTime) return performers.map((p) => ({ ...p, startTime: null, startMinutes: null }))
  let cursor = timeToMinutes(showTime)
  return performers.map((p) => {
    const startMinutes = cursor
    const startTime = minutesToTime(cursor)
    cursor += p.set_length ?? 0
    return { ...p, startTime, startMinutes }
  })
}

function nowInMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function getCurrentSlotIndex(ros) {
  const now = nowInMinutes()
  let current = -1
  for (let i = 0; i < ros.length; i++) {
    if (ros[i].startMinutes != null && now >= ros[i].startMinutes) current = i
  }
  return current
}

// ─── Live clock ───────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-2xl font-bold text-cream tabular-nums">
      {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
    </span>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function CollapsibleSection({ title, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-mid/20 pt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center py-4"
      >
        <h2 className="font-display text-xl text-cream">
          {title}
          {badge != null && (
            <span className="ml-2 text-base font-sans font-normal text-soft">{badge}</span>
          )}
        </h2>
        <span className="text-soft text-sm select-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </section>
  )
}

// ─── Large checkbox row ───────────────────────────────────────────────────────

function CheckRow({ label, sub, done, onToggle }) {
  return (
    <div
      className="flex items-center gap-4 py-4 border-b border-mid/15 last:border-0 cursor-pointer active:bg-mid/10 transition-colors"
      onClick={onToggle}
    >
      <div
        className={cn(
          'w-9 h-9 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
          done ? 'bg-sage border-sage' : 'border-mid/40'
        )}
      >
        {done && <span className="text-deep text-base font-bold leading-none">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('text-lg leading-snug', done ? 'line-through text-soft' : 'text-cream')}>
          {label}
        </div>
        {sub && <div className="text-sm text-soft mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

// ─── Contact popup (tapping a run-of-show slot) ───────────────────────────────

function ContactPopup({ person, onClose }) {
  const [copied, setCopied] = useState(null)

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const contacts = [
    person.instagram && { key: 'instagram', label: 'Instagram', value: person.instagram },
    person.contact_info && {
      key: 'contact',
      label: person.contact_method ?? 'Contact',
      value: person.contact_info,
    },
  ].filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] rounded-2xl border border-mid/30 p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display text-xl text-cream">{person.name}</h3>
            {(person.act_type || person.role) && (
              <p className="text-soft text-sm capitalize mt-0.5">
                {person.act_type ?? person.role}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-soft text-2xl leading-none ml-3">
            ×
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-soft text-sm text-center py-2">No contact info saved.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map(({ key, label, value }) => (
              <button
                key={key}
                onClick={() => handleCopy(value, key)}
                className="w-full flex justify-between items-center bg-mid/20 rounded-xl px-4 py-3 text-left"
              >
                <span className="text-soft text-sm">{label}</span>
                <span
                  className={cn(
                    'text-base transition-colors',
                    copied === key ? 'text-sage' : 'text-cream'
                  )}
                >
                  {copied === key ? 'Copied!' : value}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quick Contacts row ───────────────────────────────────────────────────────

function ContactRow({ name, sub, contactMethod, contactInfo }) {
  const [copied, copy] = useCopyToClipboard()

  return (
    <div
      className={cn(
        'flex items-center justify-between py-4 border-b border-mid/15 last:border-0',
        contactInfo && 'cursor-pointer active:bg-mid/10 transition-colors'
      )}
      onClick={() => copy(contactInfo)}
    >
      <div>
        <div className="text-lg font-medium text-cream">{name}</div>
        {sub && <div className="text-soft text-sm capitalize">{sub}</div>}
      </div>
      {contactInfo ? (
        <div className="text-right ml-3">
          {contactMethod && <div className="text-soft text-xs">{contactMethod}</div>}
          <div className={cn('text-base', copied ? 'text-sage' : 'text-cream/80')}>
            {copied ? 'Copied!' : contactInfo}
          </div>
        </div>
      ) : (
        <span className="text-soft text-sm">No contact</span>
      )}
    </div>
  )
}

// ─── Quick Comms modal ────────────────────────────────────────────────────────

function QuickCommsModal({ show, onClose }) {
  const [copied, copy] = useCopyToClipboard(2500)

  const template =
    (show.commTemplates ?? []).find((t) => /group|details|blast/i.test(t.name)) ??
    show.commTemplates?.[0]

  const rendered = template ? fillTemplate(template.body, show) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-[#1c1c1c] rounded-2xl border border-mid/30 p-6 w-full max-w-sm max-h-[82vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-xl text-cream">Quick Comms</h3>
          <button onClick={onClose} className="text-soft text-2xl leading-none">
            ×
          </button>
        </div>

        {!template ? (
          <p className="text-soft text-sm text-center py-4">
            No comms templates found. Add templates in the series Comms settings.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-soft text-xs uppercase tracking-wide mb-1">Template</p>
              <p className="text-cream font-medium">{template.name}</p>
            </div>

            <div className="bg-mid/10 rounded-xl p-4 mb-5">
              <p className="text-cream text-sm whitespace-pre-wrap leading-relaxed">{rendered}</p>
            </div>

            <button
              onClick={() => copy(rendered)}
              className={cn(
                'w-full py-3 rounded-xl font-medium text-base transition-colors',
                copied ? 'bg-sage text-deep' : 'bg-coral text-cream active:bg-coral/80'
              )}
            >
              {copied ? '✓ Copied to clipboard' : 'Copy to clipboard'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShowDayMode({ show, duties: dutiesProp = [], onExit }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Optimistic done state: { id: bool }
  const [optimistic, setOptimistic] = useState({})
  const [contactPerson, setContactPerson] = useState(null)
  const [commsOpen, setCommsOpen] = useState(false)

  // Tick every 10s to update current/next slot
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10000)
    return () => clearInterval(t)
  }, [])

  // Run of show — memoized so tick-only re-renders don't recompute
  const ros = useMemo(
    () => buildRunOfShow(show.performers ?? [], show.show_time),
    [show.performers, show.show_time]
  )
  const currentIdx = getCurrentSlotIndex(ros)

  // Day-of tasks: pending first, done after
  const showDayTasks = (show.checklistItems ?? []).filter(
    (i) => i.stage === 'day' && i.is_active !== false
  )
  const pendingTasks = showDayTasks.filter((t) => !(optimistic[t.id] ?? t.done))
  const doneTasks = showDayTasks.filter((t) => optimistic[t.id] ?? t.done)

  // Duties from show object (grouped) or prop fallback
  const duties = show.duties ?? dutiesProp

  const pendingDutyCount = duties.reduce(
    (sum, g) => sum + g.duties.filter((d) => !(optimistic[d.id] ?? d.done)).length,
    0
  )

  function handleChecklistToggle(itemId, currentDone) {
    setOptimistic((prev) => ({ ...prev, [itemId]: !currentDone }))
    startTransition(async () => {
      await toggleChecklistItem(itemId)
      router.refresh()
    })
  }

  function handleDutyToggle(dutyId, currentDone) {
    setOptimistic((prev) => ({ ...prev, [dutyId]: !currentDone }))
    startTransition(async () => {
      await toggleDutyCompleted(dutyId)
      router.refresh()
    })
  }

  // Contacts
  const performers = show.performers ?? []
  const hosts = performers.filter((p) => p.act_type === 'host' || p.role === 'host')
  const regularPerformers = performers.filter((p) => p.act_type !== 'host' && p.role !== 'host')
  const crew = show.crew ?? []
  const totalContacts = performers.length + crew.length

  return (
    <div className="min-h-screen bg-deep text-cream" style={{ fontSize: '18px' }}>

      {/* ── Sticky top bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0d0d0d]/95 backdrop-blur border-b border-mid/20 px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-start gap-4 mb-3">
            <div>
              <h1 className="font-display text-2xl text-cream leading-tight">
                {show.series?.name}
              </h1>
              <p className="text-soft text-sm mt-0.5">
                {formatDate(show.date)}
                {(show.venue_name ?? show.series?.venue_name) && (
                  <> · {show.venue_name ?? show.series?.venue_name}</>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <LiveClock />
              <button
                onClick={onExit}
                className="text-sm text-soft border border-mid/30 rounded-lg px-3 py-1.5 hover:bg-mid/20 transition-colors"
              >
                Exit Show Day Mode
              </button>
            </div>
          </div>

          {/* Times */}
          <div className="flex gap-6">
            {show.call_time && (
              <div>
                <div className="text-soft text-xs uppercase tracking-wide">Call</div>
                <div className="font-mono text-xl font-bold text-cream">
                  {formatTime(show.call_time)}
                </div>
              </div>
            )}
            {show.doors_time && (
              <div>
                <div className="text-soft text-xs uppercase tracking-wide">Doors</div>
                <div className="font-mono text-xl font-bold text-cream">
                  {formatTime(show.doors_time)}
                </div>
              </div>
            )}
            {show.show_time && (
              <div>
                <div className="text-soft text-xs uppercase tracking-wide">Show</div>
                <div className="font-mono text-xl font-bold text-peach">
                  {formatTime(show.show_time)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-5 pb-28">

        {/* 1. Run of Show */}
        <CollapsibleSection
          title="Run of Show"
          badge={ros.length > 0 ? `${ros.length} slots` : null}
          defaultOpen
        >
          {ros.length === 0 ? (
            <p className="text-soft py-2">No performers added yet.</p>
          ) : (
            <div>
              {ros.map((p, idx) => {
                const isCurrent = idx === currentIdx
                const isNext = currentIdx >= 0 && idx === currentIdx + 1
                const barColor = ACT_COLORS[p.act_type] ?? 'bg-mid/30'

                return (
                  <div
                    key={p.showPerformerId}
                    className={cn(
                      'flex items-center gap-3 py-5 border-b border-mid/15 last:border-0 cursor-pointer transition-colors',
                      isCurrent ? 'bg-sage/10 -mx-5 px-5' : 'active:bg-mid/10'
                    )}
                    onClick={() => setContactPerson(p)}
                  >
                    {/* NOW / NEXT label */}
                    <div className="w-12 shrink-0 text-center">
                      {isCurrent && (
                        <span className="text-xs font-bold text-sage uppercase tracking-wider">
                          NOW
                        </span>
                      )}
                      {isNext && (
                        <span className="text-xs text-soft/70 uppercase tracking-wider">NEXT</span>
                      )}
                    </div>

                    {/* Time */}
                    <div className="w-20 shrink-0">
                      <span className="font-mono font-bold text-2xl text-cream tabular-nums">
                        {p.startTime ?? '—'}
                      </span>
                    </div>

                    {/* Color bar */}
                    <div
                      className={cn(
                        'w-1 self-stretch rounded-full shrink-0 min-h-10',
                        barColor
                      )}
                    />

                    {/* Name + walk-up */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xl font-bold text-cream leading-tight">{p.name}</div>
                      {p.walk_up_song && (
                        <div className="text-soft text-sm mt-0.5 truncate">
                          🎵 {p.walk_up_song}
                        </div>
                      )}
                    </div>

                    {/* Set length */}
                    {p.set_length != null && (
                      <div className="text-soft text-lg shrink-0">{p.set_length}m</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CollapsibleSection>

        {/* 2. Duties */}
        {duties.length > 0 && (
          <CollapsibleSection
            title="Duties"
            badge={pendingDutyCount > 0 ? `${pendingDutyCount} remaining` : 'all done ✓'}
            defaultOpen={false}
          >
            {duties.map((group) => {
              const pending = group.duties.filter((d) => !(optimistic[d.id] ?? d.done))
              const done = group.duties.filter((d) => optimistic[d.id] ?? d.done)
              return (
                <div key={group.assignedTo} className="mb-6 last:mb-0">
                  <p className="text-xs text-soft uppercase tracking-wider font-semibold mb-1">
                    {group.assignedTo}
                    <span className="ml-2 normal-case font-normal">
                      {done.length}/{group.duties.length} done
                    </span>
                  </p>
                  {[...pending, ...done].map((d) => (
                    <CheckRow
                      key={d.id}
                      label={d.duty}
                      sub={d.time_note}
                      done={optimistic[d.id] ?? d.done}
                      onToggle={() => handleDutyToggle(d.id, optimistic[d.id] ?? d.done)}
                    />
                  ))}
                </div>
              )
            })}
          </CollapsibleSection>
        )}

        {/* 3. Day-of Tasks */}
        <CollapsibleSection
          title="Day-of Tasks"
          badge={pendingTasks.length > 0 ? pendingTasks.length : null}
          defaultOpen
        >
          {showDayTasks.length === 0 ? (
            <p className="text-soft py-2">
              No show-day tasks. Add tasks with stage "Show Day" in the Checklist tab.
            </p>
          ) : (
            [...pendingTasks, ...doneTasks].map((task) => (
              <CheckRow
                key={task.id}
                label={task.name}
                sub={task.default_owner ?? null}
                done={optimistic[task.id] ?? task.done}
                onToggle={() =>
                  handleChecklistToggle(task.id, optimistic[task.id] ?? task.done)
                }
              />
            ))
          )}
        </CollapsibleSection>

        {/* 4. Quick Contacts */}
        <CollapsibleSection
          title="Quick Contacts"
          badge={totalContacts > 0 ? totalContacts : null}
          defaultOpen={false}
        >
          {totalContacts === 0 ? (
            <p className="text-soft py-2">No performers or crew added yet.</p>
          ) : (
            <div className="space-y-6">
              {regularPerformers.length > 0 && (
                <div>
                  <p className="text-xs text-soft uppercase tracking-wider mb-1">Performers</p>
                  {regularPerformers.map((p) => (
                    <ContactRow
                      key={p.showPerformerId}
                      name={p.name}
                      sub={p.act_type}
                      contactMethod={p.instagram ? 'Instagram' : null}
                      contactInfo={p.instagram}
                    />
                  ))}
                </div>
              )}
              {hosts.length > 0 && (
                <div>
                  <p className="text-xs text-soft uppercase tracking-wider mb-1">Hosts</p>
                  {hosts.map((p) => (
                    <ContactRow
                      key={p.showPerformerId}
                      name={p.name}
                      sub="Host"
                      contactMethod={p.instagram ? 'Instagram' : null}
                      contactInfo={p.instagram}
                    />
                  ))}
                </div>
              )}
              {crew.length > 0 && (
                <div>
                  <p className="text-xs text-soft uppercase tracking-wider mb-1">Crew</p>
                  {crew.map((c) => (
                    <ContactRow
                      key={c.id}
                      name={c.name}
                      sub={c.role}
                      contactMethod={c.contact_method}
                      contactInfo={c.contact_info}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* ── Floating Quick Comms button ────────────────────────────────── */}
      {(show.commTemplates ?? []).length > 0 && (
        <button
          onClick={() => setCommsOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-16 h-16 rounded-full bg-coral shadow-xl flex items-center justify-center text-2xl text-cream active:scale-95 transition-transform"
          aria-label="Quick Comms"
        >
          ✉
        </button>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {contactPerson && (
        <ContactPopup person={contactPerson} onClose={() => setContactPerson(null)} />
      )}
      {commsOpen && <QuickCommsModal show={show} onClose={() => setCommsOpen(false)} />}
    </div>
  )
}
