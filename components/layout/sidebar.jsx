'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronRight,
  faUsers,
  faGear,
  faTrash,
  faPlus,
  faBars,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { cn, formatShortDate } from '@/lib/utils'
import { CreateSeriesModal } from '@/components/forms/create-series-modal'

// ─── Nav link helpers ────────────────────────────────────────────────────────

function NavLink({ href, children, className, indent = false }) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-body transition-colors',
        indent && 'ml-4 pl-2.5',
        isActive
          ? 'bg-coral/15 text-coral font-medium'
          : 'text-mid hover:bg-peach hover:text-deep',
        className
      )}
    >
      {children}
    </Link>
  )
}

// ─── Series item (expandable) ─────────────────────────────────────────────────

function SeriesItem({ series, defaultOpen = false }) {
  const pathname = usePathname()
  const seriesHref = `/dashboard/series/${series.id}`

  // Auto-open if any child show is the active route.
  const hasActiveChild = series.shows?.some((s) =>
    pathname.startsWith(`/dashboard/shows/${s.id}`)
  )
  const [open, setOpen] = useState(defaultOpen || hasActiveChild)

  const isSeriesActive =
    pathname === seriesHref || pathname.startsWith(seriesHref + '/')

  return (
    <li>
      {/* Series row */}
      <div className="flex items-center gap-0.5">
        {/* Expand toggle (only when there are shows) */}
        {series.shows?.length > 0 ? (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-7 w-5 shrink-0 items-center justify-center rounded text-soft hover:text-mid transition-colors"
            aria-expanded={open}
            aria-label={open ? 'Collapse series' : 'Expand series'}
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className={cn('h-3 w-3 shrink-0 transition-transform duration-200', open && 'rotate-90')}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <Link
          href={seriesHref}
          className={cn(
            'flex flex-1 min-w-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-body transition-colors',
            isSeriesActive
              ? 'bg-coral/15 text-coral font-medium'
              : 'text-mid hover:bg-peach hover:text-deep'
          )}
        >
          <span className="truncate">{series.name}</span>
          {series.is_one_off && (
            <span className="shrink-0 text-[10px] font-medium text-soft bg-peach rounded px-1 py-0.5 leading-none">
              one-off
            </span>
          )}
        </Link>
      </div>

      {/* Shows nested list */}
      {open && series.shows?.length > 0 && (
        <ul className="mt-0.5 space-y-0.5">
          {series.shows.map((show) => {
            const showHref = `/dashboard/shows/${show.id}`
            const isShowActive = pathname === showHref || pathname.startsWith(showHref + '/')
            const label = show.title || (show.date ? formatShortDate(show.date) : 'Untitled show')
            return (
              <li key={show.id}>
                <Link
                  href={showHref}
                  className={cn(
                    'flex items-center gap-2 rounded-lg pl-9 pr-2.5 py-1.5 text-xs font-body transition-colors',
                    isShowActive
                      ? 'bg-coral/15 text-coral font-medium'
                      : 'text-soft hover:bg-peach hover:text-deep'
                  )}
                >
                  <span className="truncate">{label}</span>
                  {show.date && (
                    <span className="shrink-0 text-[10px] tabular-nums text-soft/70">
                      {formatShortDate(show.date)}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

// ─── Inner sidebar content ────────────────────────────────────────────────────

function SidebarContent({ series, isDemo, onClose }) {
  const [newSeriesOpen, setNewSeriesOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      {/* Logo + optional close button */}
      <div className="flex items-center justify-between px-4 py-5 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 group"
          onClick={onClose}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-coral shrink-0 group-hover:scale-110 transition-transform" aria-hidden="true" />
          <span className="font-display text-lg font-semibold text-deep tracking-tight">
            Greenroom
          </span>
          {isDemo && (
            <span className="text-[10px] font-semibold font-body uppercase tracking-wide text-coral bg-coral/10 rounded px-1.5 py-0.5 leading-none">
              Demo
            </span>
          )}
        </Link>

        {/* Close button — only shown on mobile overlay */}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-soft hover:bg-peach hover:text-deep transition-colors"
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faXmark} className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Series section */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="mb-1 px-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-soft/70 font-body">
            Series
          </span>
        </div>

        {series?.length > 0 ? (
          <ul className="space-y-0.5">
            {series.map((s) => (
              <SeriesItem key={s.id} series={s} />
            ))}
          </ul>
        ) : (
          <p className="px-2.5 text-xs text-soft font-body">No series yet.</p>
        )}

        {/* New series / show */}
        <button
          onClick={() => setNewSeriesOpen(true)}
          className={cn(
            'mt-3 w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-body',
            'text-soft hover:bg-peach hover:text-deep transition-colors'
          )}
        >
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          New series / show
        </button>
      </div>

      <CreateSeriesModal open={newSeriesOpen} onClose={() => setNewSeriesOpen(false)} />

      {/* Global tools */}
      <div className="shrink-0 border-t border-peach px-2 py-3 space-y-0.5">
        <div className="mb-1 px-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-soft/70 font-body">
            Global Tools
          </span>
        </div>
        <NavLink href="/dashboard/performers">
          <FontAwesomeIcon icon={faUsers} className="h-4 w-4 shrink-0" aria-hidden="true" />
          Performer Database
        </NavLink>
        <NavLink href="/dashboard/trash">
          <FontAwesomeIcon icon={faTrash} className="h-4 w-4 shrink-0" aria-hidden="true" />
          Trash
        </NavLink>
        <NavLink href="/dashboard/settings">
          <FontAwesomeIcon icon={faGear} className="h-4 w-4 shrink-0" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function Sidebar({ series, isDemo = false }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mobileOpen])

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [mobileOpen])

  const close = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col border-r border-peach bg-white">
        <SidebarContent series={series} isDemo={isDemo} />
      </aside>

      {/* ── Mobile: hamburger button (fixed, top-left) ── */}
      <button
        className={cn(
          'fixed top-3 left-3 z-40 flex md:hidden items-center justify-center',
          'h-9 w-9 rounded-lg bg-white border border-peach text-mid shadow-sm',
          'hover:bg-peach transition-colors'
        )}
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
      >
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          {/* Dim layer — click outside to close */}
          <div
            className="absolute inset-0 bg-deep/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Sliding panel */}
          <div className="absolute inset-y-0 left-0 w-72 max-w-full bg-white shadow-xl flex flex-col">
            <SidebarContent series={series} isDemo={isDemo} onClose={close} />
          </div>
        </div>
      )}
    </>
  )
}
