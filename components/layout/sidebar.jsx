'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, formatShortDate } from '@/lib/utils'
import { CreateSeriesModal } from '@/components/forms/create-series-modal'

// ─── Icons ──────────────────────────────────────────────────────────────────

function ChevronIcon({ open }) {
  return (
    <svg
      className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-soft', open && 'rotate-90')}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
    </svg>
  )
}

function HamburgerIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

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
            <ChevronIcon open={open} />
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
            <CloseIcon />
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
          <PlusIcon />
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
          <UsersIcon />
          Performer Database
        </NavLink>
        <NavLink href="/dashboard/settings">
          <SettingsIcon />
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
        <HamburgerIcon />
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
