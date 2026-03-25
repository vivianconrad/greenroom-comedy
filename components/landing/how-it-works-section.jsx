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

export function HowItWorksSection() {
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
