import Link from 'next/link'
import { cn } from '@/lib/utils'

function ChevronSeparator() {
  return (
    <svg
      className="h-3.5 w-3.5 text-soft/50 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

/**
 * Breadcrumb navigation.
 *
 * @param {Array<{label: string, href?: string}>} items
 *   Pass `href` for every level except the last (current page).
 *   The last item is rendered as plain text in `text-deep`.
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'All Shows', href: '/dashboard' },
 *     { label: 'Tuesday Night Live', href: '/dashboard/series/123' },
 *     { label: 'Mar 22' },
 *   ]} />
 */
export function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 flex-wrap', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-1.5 min-w-0">
            {index > 0 && <ChevronSeparator />}

            {isLast || !item.href ? (
              <span
                className={cn(
                  'text-sm font-body truncate',
                  isLast ? 'text-deep font-medium' : 'text-soft'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-body text-coral hover:text-coral-hover hover:underline truncate transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
