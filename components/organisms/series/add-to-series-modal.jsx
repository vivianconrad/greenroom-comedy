'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/atoms/modal'
import { Input } from '@/components/atoms/input'
import { Textarea } from '@/components/atoms/textarea'
import { Button } from '@/components/atoms/button'
import { addPerformerToSeries, createPerformerAndAddToSeries } from '@/lib/actions/performers'

export function AddToSeriesModal({ open, onClose, seriesId, availablePerformers }) {
  const router = useRouter()
  const [mode, setMode] = useState('pick')
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState({})
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    if (isPending) return
    setSearch('')
    setErrors({})
    setMode('pick')
    onClose()
  }

  function switchMode(next) {
    setMode(next)
    setErrors({})
  }

  function handlePickPerformer(performerId) {
    startTransition(async () => {
      const result = await addPerformerToSeries(performerId, seriesId)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      handleClose()
    })
  }

  function handleCreateSubmit(e) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name')?.toString().trim()
    if (!name) {
      setErrors({ name: 'Name is required.' })
      return
    }
    setErrors({})
    startTransition(async () => {
      const result = await createPerformerAndAddToSeries(formData, seriesId)
      if (result?.error) {
        setErrors({ form: result.error })
        return
      }
      router.refresh()
      handleClose()
    })
  }

  const filtered = availablePerformers.filter(
    (p) => search === '' || p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal open={open} onClose={handleClose} title="Add performer">
      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-peach/50 rounded-lg mb-5">
        <button
          type="button"
          onClick={() => switchMode('pick')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium font-body rounded-md transition-colors ${
            mode === 'pick' ? 'bg-white text-deep shadow-sm' : 'text-soft hover:text-deep'
          }`}
        >
          From database
        </button>
        <button
          type="button"
          onClick={() => switchMode('new')}
          className={`flex-1 px-3 py-1.5 text-sm font-medium font-body rounded-md transition-colors ${
            mode === 'new' ? 'bg-white text-deep shadow-sm' : 'text-soft hover:text-deep'
          }`}
        >
          Add new contact
        </button>
      </div>

      {mode === 'pick' ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Search performers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-peach focus:outline-none focus:ring-2 focus:ring-coral/30 font-body bg-white"
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-soft/60 font-body text-center py-8">
              {availablePerformers.length === 0
                ? 'All contacts are already in this series.'
                : 'No performers match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-peach max-h-64 overflow-y-auto rounded-lg border border-peach">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handlePickPerformer(p.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-peach/50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-medium text-deep font-body">{p.name}</span>
                        {p.stage_name && (
                          <span className="text-xs text-soft/60 font-body">"{p.stage_name}"</span>
                        )}
                        {p.act_type && (
                          <span className="text-xs text-soft/60 font-body">{p.act_type}</span>
                        )}
                      </div>
                      {p.clip_url && (
                        <a
                          href={p.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-coral hover:underline font-body"
                        >
                          Watch clip ↗
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-coral font-body shrink-0">Add →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.form && (
            <p role="alert" className="text-sm text-red font-body">
              {errors.form}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Name"
                name="name"
                placeholder="e.g. Jordan Rivers"
                error={errors.name}
                autoFocus
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input label="Pronouns" name="pronouns" placeholder="e.g. she/her" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input label="Act type" name="act_type" placeholder="e.g. Stand-up, Drag" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input label="Instagram" name="instagram" placeholder="@handle" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="performer@example.com"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Best way to contact"
                name="contact_method"
                placeholder="e.g. Instagram DM"
              />
            </div>
          </div>
          <Input
            label="How we met"
            name="how_we_met"
            placeholder="e.g. Open mic at The Punchline"
          />
          <Textarea
            label="Notes"
            name="notes"
            placeholder="Anything useful to remember…"
            maxLength={1000}
          />
          {errors.form && (
            <p role="alert" className="text-sm text-red font-body -mt-1">
              {errors.form}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              Add to series
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
