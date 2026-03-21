import { cn } from '@/lib/utils'

function EmptyState({ icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 gap-4',
        className
      )}
    >
      {icon && (
        <div className="text-4xl leading-none select-none" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-sm">
        <h3 className="text-base font-semibold text-deep font-display">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-soft font-body leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
