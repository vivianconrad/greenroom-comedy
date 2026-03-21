export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full bg-coral"
          aria-hidden="true"
        />
        <span className="font-display text-2xl font-semibold text-deep tracking-tight">
          Greenroom
        </span>
      </div>

      {/* Card slot */}
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
