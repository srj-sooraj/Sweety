import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarDays,
  ClipboardList,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { reportsApi, readingsApi } from '../services/api';
import { formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import { getGlucoseCategory, getSlotLabel } from '../utils/glucoseHelpers';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function DailyReportPage() {
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [readingToDelete, setReadingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchReport(dateToFetch) {
    setLoading(true);
    setError('');
    try {
      const data = await reportsApi.daily(dateToFetch);
      setReport(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load daily report.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  async function handleDeleteConfirm() {
    if (!readingToDelete) return;
    setIsDeleting(true);
    try {
      await readingsApi.remove(readingToDelete.id);
      setSuccessMsg('Reading deleted successfully.');
      setReadingToDelete(null);
      await fetchReport(selectedDate);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  }

  const readings = report?.readings || [];
  const totalCount = report?.totalReadings || 0;
  const canAddMore = totalCount < 4;

  return (
    <div className="space-y-6">
      {/* Header and Date Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Daily Glucose Report
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Select any calendar date to view complete statistics and individual readings for that day.
          </p>
        </div>

        {/* Date Selector input */}
        <div className="flex items-center gap-2">
          <label htmlFor="daily-date-picker" className="text-xs font-semibold text-slate-600">
            Date:
          </label>
          <input
            id="daily-date-picker"
            type="date"
            max={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {selectedDate !== today && (
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-teal-700 hover:bg-slate-50"
            >
              Today
            </button>
          )}
        </div>
      </div>

      <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
      <AlertBanner type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} />

      {/* Date banner */}
      <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar className="h-5 w-5 text-teal-700" />
          <div>
            <p className="text-xs font-medium text-teal-700 uppercase tracking-wider">Report For</p>
            <p className="text-base font-bold text-slate-900">
              {formatDisplayDate(selectedDate)}
            </p>
          </div>
        </div>

        {canAddMore && (
          <Link
            to="/readings/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Reading for this Date
          </Link>
        )}
      </div>

      {/* Daily Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Readings"
          value={`${totalCount}/4`}
          subtitle={totalCount === 0 ? 'No readings logged' : `${totalCount} slots completed`}
          icon={ClipboardList}
          tone="teal"
        />
        <StatCard
          title="Average Glucose"
          value={report?.average}
          unit="mg/dL"
          subtitle="Mean daily value"
          icon={Activity}
          tone="sky"
        />
        <StatCard
          title="Highest Reading"
          value={report?.highest}
          unit="mg/dL"
          subtitle="Peak value"
          icon={ArrowUpRight}
          tone="rose"
        />
        <StatCard
          title="Lowest Reading"
          value={report?.lowest}
          unit="mg/dL"
          subtitle="Minimum value"
          icon={ArrowDownRight}
          tone="indigo"
        />
      </div>

      {/* Individual Readings for Selected Date */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Individual Readings ({totalCount})
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          All recorded slots for {formatDisplayDate(selectedDate)} ordered chronologically by slot.
        </p>

        {loading ? (
          <LoadingSpinner label="Loading daily readings..." />
        ) : totalCount === 0 ? (
          <EmptyState
            title={`No readings recorded for ${formatDisplayDate(selectedDate)}`}
            description="There are no blood glucose records for this date. You can log one now."
            actionLabel="Add Glucose Reading"
            actionTo="/readings/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Reading Slot</th>
                  <th className="py-3 px-4">Glucose Level</th>
                  <th className="py-3 px-4">Clinical Category</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((r) => {
                  const category = getGlucoseCategory(r.glucoseValue, r.readingSlot);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {getSlotLabel(r.readingSlot)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-base font-bold text-slate-900">
                          {r.glucoseValue}
                        </span>{' '}
                        <span className="text-xs text-slate-500 font-medium">mg/dL</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}
                        >
                          {category.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/readings/${r.id}/edit`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Edit reading"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setReadingToDelete(r)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete reading"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        reading={readingToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setReadingToDelete(null)}
      />
    </div>
  );
}
