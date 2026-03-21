'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder,
    className,
    id: idProp,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-soft font-body">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full appearance-none rounded-lg border bg-cream px-3.5 py-2.5 pr-9',
            'text-sm text-deep font-body',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent',
            error
              ? 'border-red focus:ring-red'
              : 'border-peach hover:border-soft',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(({ value, label: optLabel }) => (
            <option key={value} value={value}>
              {optLabel}
            </option>
          ))}
        </select>
        {/* chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            className="h-4 w-4 text-soft"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red font-body">
          {error}
        </p>
      )}
    </div>
  )
})

export { Select }
