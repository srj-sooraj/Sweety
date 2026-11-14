import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  ClipboardList,
} from 'lucide-react';
import { reportsApi, readingsApi } from '../services/api';
import { formatDisplayDate } from '../utils/dateUtils';
import { getGlucoseCategory, getSlotLabel } from '../utils/glucoseHelpers';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';

export function MonthToDateReportPage() {
  const [report, setReport] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const reportData = await reportsApi.monthToDate();
        setReport(reportData);

        if (reportData?.period?.startDate && reportData?.period?.endDate) {
          const list = await readingsApi.list({
            startDate: reportData.period.startDate,
            endDate: reportData.period.endDate,
          });
          setReadings(list);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load Month-to-Date report.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Compiling Month-to-Date statistics..." />;
  }

  const totalCount = report?.totalReadings || 0;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CalendarRange className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Month-to-Date Glucose Report
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Cumulative statistics from the 1st of the current month through today.
          </p>
        </div>

        <Link
          to="/readings/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors self-start sm:self-auto"
        >
          Add Reading
        </Link>
      </div>

      <AlertBanner type="error" message={error} onDismiss={() => setError('')} />

      {/* Period Details Banner */}
      <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Reporting Period
            </p>
            <p className="text-base font-bold text-slate-900">
              {report?.period?.label}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-600">
            Date Span:{' '}
            <span className="font-semibold text-slate-900">
              {formatDisplayDate(report?.period?.startDate)}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {formatDisplayDate(report?.period?.endDate)}
            </span>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Readings"
          value={totalCount}
          subtitle="Readings recorded this month"
          icon={ClipboardList}
          tone="teal"
        />
        <StatCard
          title="Average Glucose"
          value={report?.average}
          unit="mg/dL"
          subtitle="Mean monthly reading (1 dec)"
          icon={Activity}
          tone="sky"
        />
        <StatCard
          title="Highest Reading"
          value={report?.highest}
          unit="mg/dL"
          subtitle="Peak value this month"
          icon={ArrowUpRight}
          tone="rose"
        />
        <StatCard
          title="Lowest Reading"
          value={report?.lowest}
          unit="mg/dL"
          subtitle="Minimum value this month"
          icon={ArrowDownRight}
          tone="indigo"
        />
      </div>

      {/* Breakdown List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Period Readings Breakdown ({readings.length})
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          All individual blood glucose records contributing to this month&apos;s statistical calculation.
        </p>

        {readings.length === 0 ? (
          <EmptyState
            title="No readings recorded for the current month yet"
            description="Log your daily fasting and post-meal readings to populate your month-to-date health statistics."
            actionLabel="Add Glucose Reading"
            actionTo="/readings/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Glucose Level</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => {
                  const category = getGlucoseCategory(r.glucoseValue, r.readingSlot);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span>{formatDisplayDate(r.date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {getSlotLabel(r.readingSlot)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-base font-bold text-slate-900">
                          {r.glucoseValue}
                        </span>{' '}
                        <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}
                        >
                          {category.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
