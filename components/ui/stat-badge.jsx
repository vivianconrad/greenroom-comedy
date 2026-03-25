export function StatBadge({ value, label }) {
  return (
    <span className="text-sm font-body text-soft">
      <span className="font-semibold text-deep">{value}</span>{' '}
      {label}
    </span>
  )
}
