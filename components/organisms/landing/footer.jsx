export function Footer() {
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
