export function SocialProofBar() {
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
