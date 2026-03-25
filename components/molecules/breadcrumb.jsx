import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { cn } from '@/lib/utils'

function ChevronSeparator() {
  return (
    <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-soft/50 shrink-0" aria-hidden="true" />
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
