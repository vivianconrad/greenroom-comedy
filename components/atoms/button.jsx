'use client'

import { forwardRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

const variantClasses = {
  primary:
    'bg-coral text-white hover:bg-coral-hover active:bg-coral-hover focus-visible:ring-coral',
  secondary:
    'bg-transparent text-deep border border-mid hover:bg-peach active:bg-peach focus-visible:ring-mid',
  ghost:
    'bg-transparent text-mid hover:bg-peach active:bg-peach focus-visible:ring-mid',
  danger:
    'bg-red text-white hover:bg-red/90 active:bg-red/80 focus-visible:ring-red',
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

const Spinner = () => (
  <FontAwesomeIcon icon={faSpinner} className="animate-spin h-4 w-4 shrink-0" aria-hidden="true" />
)

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    asChild = false,
    children,
    className,
    ...props
  },
  ref
) {
  const classes = cn(
    // base
    'inline-flex items-center justify-center font-body font-medium rounded-lg',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'cursor-pointer select-none',
    variantClasses[variant],
    sizeClasses[size],
    className
  )

  if (asChild && children) {
    const child = Array.isArray(children) ? children[0] : children
    if (child && typeof child === 'object' && 'props' in child) {
      const { className: childClassName, ...childProps } = child.props
      return {
        ...child,
        props: {
          ...childProps,
          ...props,
          ref,
          className: cn(classes, childClassName),
        },
      }
    }
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={disabled || loading || undefined}
      className={classes}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})

export { Button }
