'use client'

import Link from 'next/link'

export default function AuthError({ error, reset }) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="bg-white rounded-card border border-peach p-6">
      {/* Icon */}
      <div className="w-10 h-10 rounded-full bg-peach flex items-center justify-center mb-4">
        <svg
          className="w-5 h-5 text-coral"
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
      <h1 className="font-display text-xl font-semibold text-deep mb-1">
        Something went wrong
      </h1>
      <p className="text-soft text-sm mb-4">
        An unexpected error occurred. You can try again, or return to the login page.
      </p>

      {/* Dev-only technical details */}
      {isDev && error?.message && (
        <pre className="bg-peach text-deep text-xs rounded-card p-3 mb-4 overflow-auto whitespace-pre-wrap break-words">
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
          href="/login"
          className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-mid text-deep hover:bg-peach transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}
