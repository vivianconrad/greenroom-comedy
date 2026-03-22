'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { formatShortDate } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  createCollection,
  createCollectionItem,
  toggleCollectionItemRejected,
  deleteCollection,
  deleteCollectionItem,
} from '@/lib/actions/collections'

// ─── Add collection modal ─────────────────────────────────────────────────────

function AddCollectionModal({ seriesId, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createCollection(
        seriesId,
        fd.get('name'),
        fd.get('description'),
        fd.get('icon')
      )
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex gap-3">
          <Input label="Emoji / icon" name="icon" placeholder="🎯" className="w-20" />
          <div className="flex-1">
            <Input label="Collection name" name="name" placeholder="e.g. Crowd Work Bits" required autoFocus />
          </div>
        </div>
        <Textarea label="Description" name="description" placeholder="Optional description…" />
        {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>Add collection</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Add item modal ───────────────────────────────────────────────────────────

function AddItemModal({ collectionId, open, onClose }) {
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setError(null)
    onClose()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      const result = await createCollectionItem(
        collectionId,
        fd.get('text'),
        fd.get('description')
      )
      if (result?.error) { setError(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add item">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Item text" name="text" placeholder="e.g. What's your job?" required autoFocus />
        <Input label="Notes (optional)" name="description" placeholder="Context or usage notes…" />
        {error && <p role="alert" className="text-sm text-red font-body">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" size="md" onClick={handleClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" size="md" loading={isPending}>Add item</Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Single collection item row ───────────────────────────────────────────────

function CollectionItemRow({ item }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isRejected = item.status === 'rejected'
  const isUsed = item.status === 'used'

  function handleToggleReject() {
    startTransition(async () => {
      await toggleCollectionItemRejected(item.id)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCollectionItem(item.id)
      router.refresh()
    })
  }

  return (
    <li
      className={cn(
        'flex items-start gap-3 py-2.5 px-4 group hover:bg-cream/50 transition-colors',
        isRejected && 'opacity-50'
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          'mt-1 h-2 w-2 shrink-0 rounded-full',
          isUsed ? 'bg-sage' : isRejected ? 'bg-soft/30' : 'bg-coral/40'
        )}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-body text-deep', isRejected && 'line-through text-soft')}>
          {item.text}
        </p>
        {item.description && (
          <p className="text-xs text-soft font-body mt-0.5">{item.description}</p>
        )}
        {isUsed && item.usedInShow?.date && (
          <p className="text-xs text-sage font-body mt-0.5">
            Used in {formatShortDate(item.usedInShow.date)}
          </p>
        )}
      </div>

      {/* Actions — only visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!isUsed && (
          <button
            onClick={handleToggleReject}
            disabled={isPending}
            className={cn(
              'text-xs px-2 py-1 rounded font-body transition-colors',
              isRejected
                ? 'text-coral hover:bg-coral/10'
                : 'text-soft hover:bg-peach hover:text-mid'
            )}
          >
            {isRejected ? 'Restore' : 'Reject'}
          </button>
        )}
        {!isUsed && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded text-soft hover:bg-red-bg hover:text-red font-body transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </li>
  )
}

// ─── Single collection card ───────────────────────────────────────────────────

function CollectionCard({ collection, seriesId }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const availableCount = collection.items.filter((i) => i.status === 'available').length
  const usedCount = collection.items.filter((i) => i.status === 'used').length
  const rejectedCount = collection.items.filter((i) => i.status === 'rejected').length

  function handleDeleteCollection() {
    if (!confirm(`Delete "${collection.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteCollection(collection.id)
      router.refresh()
    })
  }

  return (
    <>
      <div className="rounded-card border border-peach bg-white overflow-hidden">
        {/* Header row */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-cream/50 transition-colors"
          aria-expanded={expanded}
        >
          {/* Chevron */}
          <svg
            className={cn(
              'h-4 w-4 shrink-0 text-soft transition-transform duration-200',
              expanded && 'rotate-90'
            )}
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

          {/* Icon + name */}
          {collection.icon && (
            <span className="text-lg leading-none shrink-0" aria-hidden="true">
              {collection.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-deep font-body">{collection.name}</span>
            {collection.description && (
              <span className="ml-2 text-xs text-soft font-body">{collection.description}</span>
            )}
          </div>

          {/* Counts */}
          <div
            className="flex items-center gap-2 text-xs font-body text-soft shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{availableCount} available</span>
            {usedCount > 0 && <span className="text-sage">{usedCount} used</span>}
            {rejectedCount > 0 && <span className="line-through">{rejectedCount} rejected</span>}
          </div>
        </button>

        {/* Expanded body */}
        {expanded && (
          <div className="border-t border-peach">
            {collection.items.length > 0 ? (
              <ul className="divide-y divide-peach/60">
                {collection.items.map((item) => (
                  <CollectionItemRow key={item.id} item={item} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-soft font-body">No items yet.</p>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-peach bg-cream/30">
              <button
                onClick={() => setAddItemOpen(true)}
                className="text-sm text-coral hover:underline font-body"
              >
                + Add item
              </button>
              <button
                onClick={handleDeleteCollection}
                disabled={isPending}
                className="text-xs text-soft hover:text-red font-body transition-colors"
              >
                Delete collection
              </button>
            </div>
          </div>
        )}
      </div>

      <AddItemModal
        collectionId={collection.id}
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
      />
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CollectionsTab({ collections, seriesId }) {
  const [addCollectionOpen, setAddCollectionOpen] = useState(false)

  return (
    <div className="pt-6 flex flex-col gap-4">
      {/* Top action bar */}
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={() => setAddCollectionOpen(true)}>
          + Add Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No collections yet"
          description="Collections store reusable content like crowd-work bits, intros, or games."
          className="py-16"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {collections.map((col) => (
            <CollectionCard key={col.id} collection={col} seriesId={seriesId} />
          ))}
        </div>
      )}

      <AddCollectionModal
        seriesId={seriesId}
        open={addCollectionOpen}
        onClose={() => setAddCollectionOpen(false)}
      />
    </div>
  )
}
