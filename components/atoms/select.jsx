'use client'

import { forwardRef, useId } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

const Select = forwardRef(function Select(
  {
    label,
    error,
    required,
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
        <label htmlFor={id} className="text-sm font-medium text-mid font-body">
          {label}
          {required && <span className="text-red ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          required={required}
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
          aria-required={required ? 'true' : undefined}
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
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5 text-soft" aria-hidden="true" />
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
