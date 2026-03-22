'use client'

// global-error.jsx replaces the root layout entirely, so it must render its own
// <html> and <body>. Font CSS variables from the root layout are unavailable here,
// so we fall back to system fonts.

export default function GlobalError({ error, reset }) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FFF8F0',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: '28rem' }}>
          {/* Icon */}
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: '#FFE8D6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <svg
              style={{ width: '1.5rem', height: '1.5rem', color: '#E8735A' }}
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
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#2C1810',
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#8B6F5E', marginBottom: '1.25rem' }}>
            A critical error occurred. Reloading the page usually fixes this.
          </p>

          {/* Dev-only technical details */}
          {isDev && error?.message && (
            <pre
              style={{
                backgroundColor: '#FFE8D6',
                color: '#2C1810',
                fontSize: '0.75rem',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-words',
              }}
            >
              {error.message}
            </pre>
          )}

          {/* Reload button */}
          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '2.5rem',
              padding: '0 1rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderRadius: '0.5rem',
              backgroundColor: '#E8735A',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reload page
          </button>
        </div>
      </body>
    </html>
  )
}
