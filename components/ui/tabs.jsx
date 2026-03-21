'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'

function Tabs({ tabs = [], activeTab, onChange, className }) {
  const listRef = useRef(null)

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        'flex overflow-x-auto scrollbar-none border-b border-peach',
        // hide native scrollbar cross-browser
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className
      )}
    >
      {tabs.map(({ key, label }) => {
        const isActive = key === activeTab
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(key)}
            className={cn(
              'relative shrink-0 px-4 py-3 text-sm font-medium font-body',
              'transition-colors duration-150 cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-inset',
              isActive
                ? 'text-coral'
                : 'text-soft hover:text-mid'
            )}
          >
            {label}
            {/* active indicator */}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-coral"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

export { Tabs }
