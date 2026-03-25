import Link from 'next/link'

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

export function HeroSection() {
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
