import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const Card = forwardRef(function Card(
  { variant = 'default', className, children, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-card border p-5',
        variant === 'highlighted' ? 'border-coral' : 'border-peach',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

export { Card }
