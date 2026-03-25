'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/show'
import { EmptyState } from '@/components/atoms/empty-state'

const WEEKS_LABELS = {
  3: '3 Weeks Out',
  2: '2 Weeks Out',
  1: '1 Week Out',
  0: 'Day Of',
  [-1]: 'Day After',
}

function weeksLabel(weeksOut) {
  if (weeksOut == null) return 'Unscheduled'
  return WEEKS_LABELS[weeksOut] ?? `${weeksOut} weeks out`
}

export function PromoTab({ show }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const promoItems = (show.checklistItems ?? []).filter(
    (i) => i.category === 'Promo' && i.enabled !== false
  )

  if (promoItems.length === 0) {
    return (
      <EmptyState
        title="No promo tasks"
        description="Add tasks with category 'Promo' to your series checklist template and they'll appear here, grouped by timing."
      />
    )
  }

  // Group by weeks_out
  const grouped = {}
  for (const item of promoItems) {
    const key = item.weeks_out ?? 'none'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  // Sort groups: highest weeks_out first, 'none' last
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'none') return 1
    if (b === 'none') return -1
    return Number(b) - Number(a)
  })

  function handleToggle(itemId) {
    startTransition(async () => {
      await toggleChecklistItem(itemId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {sortedGroups.map(([key, items]) => (
        <div key={key}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-soft mb-2 px-1">
            {weeksLabel(key === 'none' ? null : Number(key))}
          </h3>
          <div className="bg-white rounded-card border border-peach divide-y divide-peach">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => handleToggle(item.id)}
                  className="accent-coral shrink-0 cursor-pointer"
                />
                <span
                  className={cn(
                    'flex-1 text-sm text-deep',
                    item.done && 'line-through text-soft'
                  )}
                >
                  {item.task}
                </span>
                {item.default_owner && (
                  <span className="text-xs text-soft shrink-0">{item.default_owner}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
