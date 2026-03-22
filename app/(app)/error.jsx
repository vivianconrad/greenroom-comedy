'use client'

import Link from 'next/link'

export default function AppError({ error, reset }) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-peach flex items-center justify-center mb-5">
          <svg
            className="w-6 h-6 text-coral"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="font-display text-2xl font-semibold text-deep mb-2">
          Something went wrong
        </h1>
        <p className="text-soft text-sm mb-5">
          An unexpected error occurred. You can try again, or head back to your dashboard.
        </p>

        {/* Dev-only technical details */}
        {isDev && error?.message && (
          <pre className="bg-peach text-deep text-xs rounded-card p-3 mb-5 overflow-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg bg-coral text-white hover:bg-coral-hover transition-colors cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-mid text-deep hover:bg-peach transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
