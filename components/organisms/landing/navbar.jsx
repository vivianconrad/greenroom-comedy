import Link from 'next/link'

export function Navbar({ isLoggedIn }) {
  return (
    <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-peach/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-display text-xl text-deep hover:text-coral transition-colors shrink-0"
        >
          <span className="text-coral leading-none text-2xl">●</span>
          Greenroom
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-mid">
          <a href="#features" className="hover:text-coral transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-coral transition-colors">
            How it works
          </a>
        </div>

        {isLoggedIn ? (
          <Link
            href="/dashboard"
            className="shrink-0 bg-coral text-cream text-sm font-medium px-4 py-2 rounded-full hover:bg-coral-hover transition-colors"
          >
            Go to Dashboard →
          </Link>
        ) : (
          <Link
            href="/signup"
            className="shrink-0 bg-coral text-cream text-sm font-medium px-4 py-2 rounded-full hover:bg-coral-hover transition-colors"
          >
            Get Early Access
          </Link>
        )}
      </div>
    </nav>
  )
}
