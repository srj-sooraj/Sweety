export function StatCard({ title, value, unit, subtitle, icon: Icon, tone = 'teal' }) {
  const toneMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  const iconBoxClass = toneMap[tone] || toneMap.teal;
  const displayValue = value === null || value === undefined ? '—' : value;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{displayValue}</span>
            {unit && value !== null && value !== undefined && (
              <span className="text-sm font-medium text-slate-500">{unit}</span>
            )}
          </div>
          {subtitle && <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`rounded-xl border p-2.5 ${iconBoxClass}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
