'use client'

import { cn, formatDate } from '@/lib/utils'
import { useCopyToClipboard } from '@/lib/hooks'
import { Pill } from '@/components/atoms/pill'
import { Button } from '@/components/atoms/button'

function buildSoundSheet(show) {
  const lines = [
    `Walk-up Music — ${show.series?.name ?? 'Show'}${show.date ? ` (${formatDate(show.date)})` : ''}`,
    '',
  ]
  const relevant = show.performers.filter((p) => !p.isVirtual)
  if (relevant.length === 0) {
    lines.push('No performers added yet.')
  } else {
    relevant.forEach((p, i) => {
      const song = p.walk_up_song ? p.walk_up_song : '[no song yet]'
      lines.push(`${i + 1}. ${p.name} — ${song}`)
    })
  }
  return lines.join('\n')
}

export function MaterialsTab({ show }) {
  const [copiedSound, copySound] = useCopyToClipboard()
  const confirmed = show.performers.filter((p) => p.status === 'confirmed')
  const all = show.performers

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Walk-up music */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg text-deep">Walk-up Music</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copySound(buildSoundSheet(show))}
          >
            {copiedSound ? '✓ Copied!' : 'Copy sound sheet'}
          </Button>
        </div>
        <div className="bg-white rounded-card border border-peach divide-y divide-peach">
          {confirmed.length === 0 ? (
            <p className="px-4 py-6 text-sm text-soft text-center">
              No confirmed performers yet.
            </p>
          ) : (
            confirmed.map((p) => (
              <div key={p.showPerformerId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-deep">{p.name}</div>
                  {p.walk_up_song && (
                    <div className="text-xs text-soft mt-0.5">{p.walk_up_song}</div>
                  )}
                </div>
                {p.walk_up_song ? (
                  <Pill variant="success" className="text-xs shrink-0">
                    Received
                  </Pill>
                ) : (
                  <Pill variant="neutral" className="text-xs shrink-0">
                    Waiting
                  </Pill>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Performer photos */}
      <section>
        <h3 className="font-display text-lg text-deep mb-3">Performer Photos</h3>
        {all.length === 0 ? (
          <p className="text-sm text-soft">No performers yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {all.map((p) => (
              <div
                key={p.showPerformerId}
                className="bg-white rounded-card border border-peach p-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-peach mx-auto mb-2 flex items-center justify-center">
                  <span className="text-coral font-semibold text-sm">
                    {p.name?.charAt(0).toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="text-xs font-medium text-deep truncate mb-1">{p.name}</div>
                {p.photo_url ? (
                  <Pill variant="success" className="text-xs">
                    Received
                  </Pill>
                ) : (
                  <Pill variant="neutral" className="text-xs">
                    Waiting
                  </Pill>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tech requirements */}
      <section>
        <h3 className="font-display text-lg text-deep mb-3">Tech Requirements</h3>
        <div className="bg-white rounded-card border border-peach divide-y divide-peach">
          {all.length === 0 ? (
            <p className="px-4 py-6 text-sm text-soft text-center">No performers yet.</p>
          ) : all.some((p) => p.tags_ok != null) ? (
            all.map((p) => (
              <div key={p.showPerformerId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 text-sm font-medium text-deep">{p.name}</div>
                {p.tags_ok === true && (
                  <Pill variant="success" className="text-xs">Tags OK</Pill>
                )}
                {p.tags_ok === false && (
                  <Pill variant="warning" className="text-xs">No tags</Pill>
                )}
                {p.tags_ok == null && (
                  <Pill variant="neutral" className="text-xs">Not confirmed</Pill>
                )}
              </div>
            ))
          ) : (
            <p className="px-4 py-6 text-sm text-soft text-center">
              Collect tech requirements via performer forms.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
