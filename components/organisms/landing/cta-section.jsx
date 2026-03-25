import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="bg-deep rounded-card-lg px-8 py-16 text-center">
        <h2 className="font-display text-3xl sm:text-4xl text-cream mb-4">
          Your first show is on us
        </h2>
        <p className="text-soft text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Sign up for early access. We're building this with real producers — your feedback shapes
          what gets built next.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-coral text-cream font-medium px-8 py-4 rounded-full hover:bg-coral-hover transition-colors text-base"
        >
          Get Early Access
        </Link>
      </div>
    </section>
  )
}
