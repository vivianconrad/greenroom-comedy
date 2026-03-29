'use client'

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

const Input = forwardRef(function Input(
  {
    label,
    error,
    type = 'text',
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
      <input
        ref={ref}
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border bg-cream px-3.5 py-2.5 text-sm text-deep font-body',
          'placeholder:text-soft/80',
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
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-red font-body">
          {error}
        </p>
      )}
    </div>
  )
})

export { Input }
