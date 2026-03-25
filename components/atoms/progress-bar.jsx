import { cn } from '@/lib/utils'

function ProgressBar({ value = 0, className, ...props }) {
  const clamped = Math.min(100, Math.max(0, value))
  const isFull = clamped >= 80

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full rounded-full bg-peach overflow-hidden', className)}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300',
          isFull ? 'bg-sage' : 'bg-coral'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export { ProgressBar }
