import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function AlertBanner({ type = 'error', message, onDismiss }) {
  if (!message) return null;

  const isSuccess = type === 'success';
  const containerClass = isSuccess
    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
    : 'bg-rose-50 border-rose-200 text-rose-900';

  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${containerClass}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <p className="font-medium leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 hover:bg-black/5 transition-colors"
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
