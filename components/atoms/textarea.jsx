'use client'

import { forwardRef, useId, useState } from 'react'
import { cn } from '@/lib/utils'

const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    required,
    maxLength,
    value,
    defaultValue,
    onChange,
    placeholder,
    className,
    id: idProp,
    ...props
  },
  ref
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  const [internalLength, setInternalLength] = useState(
    () => (value ?? defaultValue ?? '').length
  )

  function handleChange(e) {
    setInternalLength(e.target.value.length)
    onChange?.(e)
  }

  const charCount = typeof value === 'string' ? value.length : internalLength

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-mid font-body">
          {label}
          {required && <span className="text-red ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        required={required}
        onChange={handleChange}
        className={cn(
          'w-full rounded-lg border bg-cream px-3.5 py-2.5 text-sm text-deep font-body',
          'placeholder:text-soft resize-y min-h-24',
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
      />
      <div className="flex justify-between items-center">
        {error ? (
          <p id={`${id}-error`} className="text-xs text-red font-body">
            {error}
          </p>
        ) : (
          <span />
        )}
        {maxLength != null && (
          <span className="text-xs text-soft font-body tabular-nums">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
})

export { Textarea }
