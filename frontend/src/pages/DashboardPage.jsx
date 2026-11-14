import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  ChevronRight,
  ClipboardList,
  History,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { readingsApi, reportsApi } from '../services/api';
import { formatDisplayDate, getTodayDateString } from '../utils/dateUtils';
import { getGlucoseCategory, getSlotLabel } from '../utils/glucoseHelpers';
import { StatCard } from '../components/StatCard';
import { EmptyState } from '../components/EmptyState';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AlertBanner } from '../components/AlertBanner';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

export function DashboardPage() {
  const { user } = useAuth();
  const today = getTodayDateString();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyReport, setDailyReport] = useState(null);
  const [mtdReport, setMtdReport] = useState(null);
  const [prevReport, setPrevReport] = useState(null);

  const [readingToDelete, setReadingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  async function loadDashboardData() {
    setLoading(true);
    setError('');
    try {
      const [daily, mtd, prev] = await Promise.all([
        reportsApi.daily(today),
        reportsApi.monthToDate(),
        reportsApi.previousMonth(),
      ]);
      setDailyReport(daily);
      setMtdReport(mtd);
      setPrevReport(prev);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function handleDeleteConfirm() {
    if (!readingToDelete) return;
    setIsDeleting(true);
    try {
      await readingsApi.remove(readingToDelete.id);
      setDeleteSuccessMsg('Reading deleted successfully.');
      setReadingToDelete(null);
      await loadDashboardData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete reading.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading health dashboard..." />;
  }

  const todayCount = dailyReport?.totalReadings || 0;
  const canAddMoreToday = todayCount < 4;

  return (
    <div className="space-y-8">
      {/* Welcome & Actions Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {user?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Today is <span className="font-semibold text-slate-700">{formatDisplayDate(today)}</span>
            . You have recorded{' '}
            <span className="font-semibold text-teal-700">{todayCount} of 4</span> readings today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/readings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            All Readings
          </Link>
          <Link
            to="/readings/new"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors ${
              canAddMoreToday
                ? 'bg-teal-600 hover:bg-teal-700'
                : 'bg-slate-400 cursor-not-allowed opacity-80'
            }`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Reading
          </Link>
        </div>
      </div>

      <AlertBanner type="error" message={error} onDismiss={() => setError('')} />
      <AlertBanner
        type="success"
        message={deleteSuccessMsg}
        onDismiss={() => setDeleteSuccessMsg('')}
      />

      {/* Today's KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-teal-600" />
            Today&apos;s Statistics
          </h2>
          <Link
            to="/reports/daily"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Detailed Daily Report <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Readings Today"
            value={`${todayCount}/4`}
            subtitle={canAddMoreToday ? `${4 - todayCount} slots available` : 'Daily limit reached'}
            icon={ClipboardList}
            tone="teal"
          />
          <StatCard
            title="Average Glucose"
            value={dailyReport?.average}
            unit="mg/dL"
            subtitle="Today's mean reading"
            icon={Activity}
            tone="sky"
          />
          <StatCard
            title="Highest Reading"
            value={dailyReport?.highest}
            unit="mg/dL"
            subtitle="Today's peak value"
            icon={ArrowUpRight}
            tone="rose"
          />
          <StatCard
            title="Lowest Reading"
            value={dailyReport?.lowest}
            unit="mg/dL"
            subtitle="Today's lowest value"
            icon={ArrowDownRight}
            tone="indigo"
          />
        </div>
      </div>

      {/* Today's Readings Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Today&apos;s Readings</h2>
            <p className="text-xs text-slate-500">
              Slots recorded for {formatDisplayDate(today)}
            </p>
          </div>
          {canAddMoreToday && (
            <Link
              to="/readings/new"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Reading
            </Link>
          )}
        </div>

        {todayCount === 0 ? (
          <EmptyState
            title="No readings recorded for today yet"
            description="Log your fasting, breakfast, lunch, or dinner reading to begin today's statistical tracking."
            actionLabel="Add Today's First Reading"
            actionTo="/readings/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Time Slot</th>
                  <th className="py-3 px-4">Glucose Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyReport.readings.map((r) => {
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

      {/* Quick Summary Cards for Month-to-Date and Previous Month */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-teal-600" />
                <h3 className="font-bold text-slate-900">Month-to-Date Summary</h3>
              </div>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                {mtdReport?.period?.label || 'Current Month'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Period: {formatDisplayDate(mtdReport?.period?.startDate)} to{' '}
              {formatDisplayDate(mtdReport?.period?.endDate)}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Average</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {mtdReport?.average ?? '—'}
                </p>
                <span className="text-[10px] text-slate-400">mg/dL</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Highest</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {mtdReport?.highest ?? '—'}
                </p>
                <span className="text-[10px] text-slate-400">mg/dL</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Readings</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {mtdReport?.totalReadings ?? 0}
                </p>
                <span className="text-[10px] text-slate-400">total</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <Link
              to="/reports/month-to-date"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Open Full Month-to-Date Report <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Previous Month Summary</h3>
              </div>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                {prevReport?.period?.label || 'Previous Month'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Period: {formatDisplayDate(prevReport?.period?.startDate)} to{' '}
              {formatDisplayDate(prevReport?.period?.endDate)}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Average</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {prevReport?.average ?? '—'}
                </p>
                <span className="text-[10px] text-slate-400">mg/dL</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Highest</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {prevReport?.highest ?? '—'}
                </p>
                <span className="text-[10px] text-slate-400">mg/dL</span>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Readings</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {prevReport?.totalReadings ?? 0}
                </p>
                <span className="text-[10px] text-slate-400">total</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
            <Link
              to="/reports/previous-month"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Open Full Previous Month Report <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
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
