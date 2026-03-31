'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

function Toggle({ checked = false, onChange, label, pending = false, className, ...props }) {
  const id = useId()

  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex items-center gap-3 select-none',
        pending ? 'cursor-wait opacity-60' : 'cursor-pointer',
        className
      )}
    >
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => !pending && onChange?.(e.target.checked)}
          disabled={pending}
          className="sr-only peer"
          {...props}
        />
        {/* track */}
        <span
          className={cn(
            'block w-10 h-6 rounded-full transition-colors duration-200',
            'bg-peach peer-checked:bg-coral',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-coral peer-focus-visible:ring-offset-2'
          )}
        />
        {/* thumb */}
        <span
          className={cn(
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            'peer-checked:translate-x-4'
          )}
        />
      </span>
      {label && (
        <span className="text-sm text-deep font-body">{label}</span>
      )}
    </label>
  )
}

export { Toggle }
