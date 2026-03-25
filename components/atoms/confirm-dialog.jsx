'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Modal } from './modal'
import { Button } from './button'

/**
 * A confirmation modal with an optional warning callout.
 *
 * Props:
 *   open          — boolean
 *   onClose       — () => void
 *   onConfirm     — () => void  (called when the destructive button is clicked)
 *   title         — string
 *   description   — string | ReactNode  (main body copy)
 *   warning       — string | ReactNode  (shown in an amber callout below description)
 *   confirmLabel  — string  (default: "Confirm")
 *   isPending     — boolean
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  warning,
  confirmLabel = 'Confirm',
  isPending = false,
}) {
  return (
    <Modal open={open} onClose={isPending ? undefined : onClose} title={title}>
      <div className="flex flex-col gap-4">
        {description && (
          <p className="text-sm font-body text-mid">{description}</p>
        )}

        {warning && (
          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <p className="text-sm font-body text-amber-800">{warning}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={onConfirm}
            loading={isPending}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
