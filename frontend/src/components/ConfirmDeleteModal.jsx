import { AlertTriangle } from 'lucide-react';
import { formatDisplayDate } from '../utils/dateUtils';
import { getSlotLabel } from '../utils/glucoseHelpers';

export function ConfirmDeleteModal({ reading, isDeleting, onConfirm, onCancel }) {
  if (!reading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="delete-modal-title" className="text-lg font-semibold text-slate-900">
              Delete glucose reading?
            </h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Are you sure you want to permanently delete the{' '}
              <span className="font-semibold text-slate-900">{reading.glucoseValue} mg/dL</span>{' '}
              reading recorded for{' '}
              <span className="font-semibold text-slate-900">
                {getSlotLabel(reading.readingSlot)}
              </span>{' '}
              on{' '}
              <span className="font-semibold text-slate-900">
                {formatDisplayDate(reading.date)}
              </span>
              ?
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Reading'}
          </button>
        </div>
      </div>
    </div>
  );
}
