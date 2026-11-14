import { Link } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';

export function EmptyState({
  title = 'No readings found',
  description = 'There are no blood glucose readings recorded for this selection yet.',
  actionLabel = 'Add Glucose Reading',
  actionTo = '/readings/new',
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600">
        <Activity className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500">{description}</p>
      {actionTo && (
        <div className="mt-5">
          <Link
            to={actionTo}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
