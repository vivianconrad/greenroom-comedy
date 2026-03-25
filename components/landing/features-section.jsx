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

export function FeaturesSection() {
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
