import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// ─── Metadata ───────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Greenroom — Show production software for comedy producers',
  description:
    'Greenroom gives independent comedy producers the checklists, timelines, and booking tools they actually need. Know what to do, when to do it, and never forget to locate the rubber ducks again.',
  openGraph: {
    title: 'Greenroom — Show production software for comedy producers',
    description:
      'Know what to do, when to do it, and never forget to locate the rubber ducks again.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Greenroom app preview' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Greenroom — Show production software for comedy producers',
    description:
      'Know what to do, when to do it, and never forget to locate the rubber ducks again.',
  },
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-cream font-body">
      <Navbar isLoggedIn={!!user} />
      <main>
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}

// ─── Navbar ─────────────────────────────────────────────────────────────────

function Navbar({ isLoggedIn }) {
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

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 lg:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Copy */}
        <div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-deep leading-[1.1] mb-6">
            Produce comedy shows{' '}
            <span className="text-coral italic border-b-4 border-butter">
              without&nbsp;losing&nbsp;your&nbsp;mind
            </span>
          </h1>
          <p className="text-mid text-lg leading-relaxed mb-8 max-w-lg">
            Greenroom gives independent comedy producers the checklists, timelines, and booking
            tools they actually need. Know what to do, when to do it, and never forget to locate
            the rubber ducks again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="bg-coral text-cream font-medium px-7 py-3.5 rounded-full hover:bg-coral-hover transition-colors text-center text-base"
            >
              Get Early Access
            </Link>
            <a
              href="#how-it-works"
              className="text-coral font-medium px-7 py-3.5 rounded-full border-2 border-coral hover:bg-peach transition-colors text-center text-base"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* Mock app preview */}
        <div className="flex justify-center lg:justify-end">
          <AppPreview />
        </div>
      </div>
    </section>
  )
}

function AppPreview() {
  return (
    <div className="rotate-1 shadow-2xl rounded-[22px]">
      <div className="bg-white rounded-[22px] border border-peach overflow-hidden w-80">
        {/* Fake browser bar */}
        <div className="bg-cream border-b border-peach px-3 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-bg" />
            <div className="w-2.5 h-2.5 rounded-full bg-sage-bg" />
          </div>
          <span className="text-[10px] text-soft/50 font-mono mx-auto tracking-tight">
            greenroom.app/shows
          </span>
        </div>

        {/* Show header */}
        <div className="px-4 pt-3 pb-3 border-b border-peach">
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <div className="text-[10px] text-soft uppercase tracking-wide mb-0.5">
                Fri Apr 11 · 8:30 PM
              </div>
              <div className="font-display text-sm text-deep font-semibold leading-snug">
                Friday Night Live Comedy
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-bg text-amber font-medium shrink-0 ml-2">
              3d away
            </span>
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-soft">Progress</span>
              <span className="text-coral font-semibold">67%</span>
            </div>
            <div className="h-1.5 bg-peach rounded-full overflow-hidden">
              <div className="h-full bg-coral rounded-full" style={{ width: '67%' }} />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-4 py-3 border-b border-peach">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-soft mb-2">
            Checklist
          </div>
          <div className="space-y-2.5">
            {[
              { done: true, text: 'Book headliner' },
              { done: true, text: 'Confirm venue deposit' },
              { done: false, text: 'Post Instagram teaser', urgent: true },
              { done: false, text: 'Send performer forms' },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-[3px] border shrink-0 flex items-center justify-center ${
                    task.done ? 'bg-coral border-coral' : 'border-soft/30'
                  }`}
                >
                  {task.done && (
                    <span className="text-cream leading-none" style={{ fontSize: '7px' }}>
                      ✓
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] flex-1 leading-none ${
                    task.done ? 'line-through text-soft' : task.urgent ? 'text-amber' : 'text-deep'
                  }`}
                >
                  {task.text}
                </span>
                {task.urgent && !task.done && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-bg text-amber rounded-full shrink-0">
                    Due soon
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Lineup */}
        <div className="px-4 py-3">
          <div className="text-[9px] font-semibold uppercase tracking-widest text-soft mb-2">
            Lineup
          </div>
          <div className="space-y-2">
            {[
              { name: 'Alex Chen', confirmed: true },
              { name: 'Jordan Moss', confirmed: true },
              { name: 'Sam Rivera', confirmed: false },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-peach flex items-center justify-center shrink-0">
                  <span className="text-coral font-bold" style={{ fontSize: '9px' }}>
                    {p.name.charAt(0)}
                  </span>
                </div>
                <span className="text-[11px] text-deep flex-1">{p.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    p.confirmed
                      ? 'bg-sage-bg text-green'
                      : 'bg-cream text-soft border border-peach'
                  }`}
                >
                  {p.confirmed ? 'Confirmed' : 'Invited'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Social Proof Bar ────────────────────────────────────────────────────────

function SocialProofBar() {
  return (
    <div className="bg-peach/40 border-y border-peach py-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0 text-sm text-mid text-center flex-wrap">
          <span>Built by producers, for producers</span>
          <span className="hidden sm:inline mx-3 text-peach select-none">·</span>
          <span>Works for stand-up, sketch, improv, drag, burlesque, and variety</span>
          <span className="hidden sm:inline mx-3 text-peach select-none">·</span>
          <span>From open mics to festivals</span>
        </div>
      </div>
    </div>
  )
}

// ─── Features ────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📋',
    title: 'Smart checklists',
    description:
      'Pick your show type and get a production timeline that counts backwards from your show date. Everything from venue deposit to post-show thank-you emails, pre-built and ready to go.',
  },
  {
    icon: '🎤',
    title: 'Performer pipeline',
    description:
      'Performers apply through your page. You book them, and a pre-show form goes out automatically — collecting bios, songs, tech riders, and payment details.',
  },
  {
    icon: '📣',
    title: 'Promo timeline',
    description:
      'Know exactly when to post that first Instagram teaser, when to open ticket sales, and what copy to use. Never scramble for captions at 11pm again.',
  },
  {
    icon: '💰',
    title: 'Payments & venue',
    description:
      'Track venue fees, performer payments, and ticket revenue in one place. See your net at a glance without opening a single spreadsheet.',
  },
  {
    icon: '🎬',
    title: 'Show-day mode',
    description:
      'A stripped-down view for when doors open. Running order, walk-up songs, show-day tasks — big text, easy to read from the green room, the wings, or the sticky-floored booth.',
  },
  {
    icon: '📊',
    title: 'Performer database',
    description:
      "Every performer who applies or performs gets a profile. Track who's a crowd favourite, who to book again, and who's still waiting on their $20.",
  },
]

function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl sm:text-4xl text-deep mb-4">
          Everything in one place
        </h2>
        <p className="text-mid text-lg max-w-xl mx-auto">
          Stop juggling spreadsheets, group chats, and sticky notes. Greenroom keeps your whole
          show in one tab.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature, i) => (
          <div
            key={i}
            className="bg-white rounded-card-lg border border-peach p-6 hover:border-coral/40 hover:shadow-sm transition-all"
          >
            <div className="text-3xl mb-4">{feature.icon}</div>
            <h3 className="font-display text-xl text-deep mb-2">{feature.title}</h3>
            <p className="text-soft text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── How It Works ────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Create a show',
    description:
      'Pick your format, set the date, choose your venue. Greenroom builds your production checklist automatically.',
  },
  {
    title: 'Book your lineup',
    description:
      'Review applications, confirm performers, and pre-show forms go out automatically. No more chasing bios over DM.',
  },
  {
    title: 'Promote & prep',
    description:
      "Follow your promo timeline, tick off tasks, and get nudged when something's slipping. Show up to showtime ready.",
  },
  {
    title: 'Run the show',
    description:
      'Switch to show-day mode. After the curtain falls, log your notes and start planning the next one.',
  },
]

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-peach/25 border-y border-peach py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl text-deep mb-4">How it works</h2>
          <p className="text-mid text-lg max-w-xl mx-auto">
            From blank canvas to curtain call in four steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {STEPS.map((step, i) => (
            <div key={i} className="relative">
              <div className="flex lg:flex-col items-start lg:items-start gap-4">
                {/* Number badge + connector */}
                <div className="flex items-center gap-0 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-coral text-cream font-display font-bold text-lg flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  {/* Horizontal connector on lg */}
                  {i < STEPS.length - 1 && (
                    <div className="hidden lg:block w-full h-px bg-coral/20 ml-2 mt-0 absolute top-5 left-12 right-0" />
                  )}
                  {/* Vertical connector on md/sm */}
                  <div className="lg:hidden w-8 h-px bg-coral/20 ml-1" />
                </div>

                <div>
                  <h3 className="font-display text-lg text-deep mb-1.5">{step.title}</h3>
                  <p className="text-soft text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA Section ─────────────────────────────────────────────────────────────

function CtaSection() {
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

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-peach py-8 bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-1.5 font-display text-lg text-deep">
            <span className="text-coral leading-none text-xl">●</span>
            Greenroom
          </div>

          <p className="text-sm text-soft text-center">© 2026 Greenroom. Built in Chicago.</p>

          <div className="flex gap-5 text-sm text-soft">
            <a href="#" className="hover:text-coral transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-coral transition-colors">
              Instagram
            </a>
            <a href="#" className="hover:text-coral transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
