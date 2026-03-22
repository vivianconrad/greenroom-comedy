import { EmptyState } from '@/components/ui/empty-state'

// ─── Highlighted body with [variable] placeholders ────────────────────────────

function CommBody({ body }) {
  if (!body) return null

  // Split on [variable] tokens and highlight them
  const parts = body.split(/(\[[^\]]+\])/)

  return (
    <p className="text-sm font-body text-mid whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\[.+\]$/.test(part) ? (
          <mark
            key={i}
            className="bg-lav-bg text-lav rounded px-0.5 font-medium not-italic"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

// ─── Template card ────────────────────────────────────────────────────────────

function CommTemplateCard({ template }) {
  return (
    <div className="rounded-card border border-peach bg-white p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-deep font-body">{template.name}</h3>
        {/* Edit button — stub; wiring requires an edit modal with server action */}
        <button
          className="shrink-0 text-xs text-soft hover:text-coral font-body transition-colors"
          aria-label={`Edit ${template.name}`}
        >
          Edit
        </button>
      </div>

      {template.body ? (
        <div className="rounded-lg bg-cream/60 border border-peach/60 px-4 py-3">
          <CommBody body={template.body} />
        </div>
      ) : (
        <p className="text-sm text-soft/60 font-body italic">No body yet.</p>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CommsTab({ templates }) {
  if (templates.length === 0) {
    return (
      <div className="pt-6">
        <EmptyState
          icon="✉️"
          title="No comms templates yet"
          description="Add message templates for performer confirmations, reminders, and show-night comms."
          className="py-16"
        />
      </div>
    )
  }

  return (
    <div className="pt-6 flex flex-col gap-4">
      {templates.map((t) => (
        <CommTemplateCard key={t.id} template={t} />
      ))}
    </div>
  )
}
